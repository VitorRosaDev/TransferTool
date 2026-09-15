import { SQLiteDatabase } from 'expo-sqlite';
import { ExportacaoModel } from './ExportacaoModel';
import type { PayloadRPA } from './ExportacaoModel';
import { ListaRancho } from './ListaRancho';
import type { StatusLista } from './interfaces';

interface ListaPersistida {
  id: number;
  origem_id: number;
  codigo_origem: string;
  escola_id: number;
  codigo_destino: string;
  data_criacao: string;
  status: StatusLista;
}

interface ItemPersistido {
  codigo_item: string;
  quantidade: number;
}

/**
 * Fronteira de escrita do agregado ListaRancho.
 *
 * Toda alteração reidrata o contexto, executa a operação no State atual e só
 * então persiste o novo retrato dentro de uma transação exclusiva do SQLite.
 */
export class ListaRanchoService {
  static async criarRascunho(db: SQLiteDatabase, origemId: number, destinoId: number): Promise<number> {
    let listaId = 0;

    await db.withExclusiveTransactionAsync(async (txn) => {
      const origem = await txn.getFirstAsync<{ codigo: string }>(
        'SELECT codigo FROM depositos_origem WHERE id = ? AND ativo = 1',
        [origemId]
      );
      const destino = await txn.getFirstAsync<{ codigo_deposito: string }>(
        'SELECT codigo_deposito FROM escolas WHERE id = ? AND ativo = 1',
        [destinoId]
      );

      if (!origem || !destino) {
        throw new Error('Origem ou destino não estão disponíveis para criar a lista.');
      }

      const lista = new ListaRancho();
      lista.definirOrigemDestino(origemId, origem.codigo, destinoId, destino.codigo_deposito);

      const result = await txn.runAsync(
        'INSERT INTO listas (origem_id, escola_id, data_criacao, status) VALUES (?, ?, ?, ?)',
        [lista.data.origem_id, lista.data.escola_id, lista.data.data_criacao, lista.data.status]
      );
      listaId = result.lastInsertRowId;
      await this.registrarTransicao(txn, listaId, 'Nenhum', lista.data.status, 'Criação inicial da lista');
    });

    return listaId;
  }

  static async adicionarItem(db: SQLiteDatabase, listaId: number, produtoId: number, quantidade: number): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
      const produto = await txn.getFirstAsync<{ codigo: string }>(
        'SELECT codigo FROM itens WHERE id = ? AND ativo = 1',
        [produtoId]
      );
      if (!produto) throw new Error('Produto não encontrado ou inativo.');

      const lista = await this.reidratar(txn, listaId);
      lista.adicionarItem({ codigo_item: produto.codigo, quantidade });
      await this.persistirItens(txn, lista);
    });
  }

  static async alterarQuantidade(db: SQLiteDatabase, idItemLista: number, quantidade: number): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
      const item = await this.buscarItem(txn, idItemLista);
      const lista = await this.reidratar(txn, item.lista_id);
      lista.alterarQuantidade(item.codigo, quantidade);
      await this.persistirItens(txn, lista);
    });
  }

  static async removerItem(db: SQLiteDatabase, idItemLista: number): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
      const item = await this.buscarItem(txn, idItemLista);
      const lista = await this.reidratar(txn, item.lista_id);
      lista.removerItem(item.codigo);
      await this.persistirItens(txn, lista);
    });
  }

  static async consolidar(db: SQLiteDatabase, listaId: number): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
      const lista = await this.reidratar(txn, listaId);
      const estadoAnterior = lista.data.status;
      lista.consolidar();
      await this.persistirTransicao(txn, lista, estadoAnterior, 'Carga finalizada fisicamente no coletor');
    });
  }

  static async reabrir(db: SQLiteDatabase, listaId: number): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
      const lista = await this.reidratar(txn, listaId);
      const estadoAnterior = lista.data.status;
      lista.reabrir();
      await this.persistirTransicao(txn, lista, estadoAnterior, 'Lista reaberta para correção da conferência');
    });
  }

  static async exportarTodas(db: SQLiteDatabase): Promise<PayloadRPA[]> {
    const listas = await db.getAllAsync<{ id: number; status: StatusLista }>(
      `SELECT id, status FROM listas
       WHERE status IN ('Consolidada', 'Exportada')
       ORDER BY data_criacao ASC, id ASC`
    );

    if (listas.length === 0) {
      throw new Error('Não há listas consolidadas para exportar.');
    }

    const payloads: PayloadRPA[] = [];
    for (const listaPersistida of listas) {
      const lista = await this.reidratar(db, listaPersistida.id);
      payloads.push(lista.gerarPayload());
    }

    await ExportacaoModel.exportarArquivo(payloads);

    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const listaPersistida of listas) {
        if (listaPersistida.status !== 'Consolidada') continue;
        const lista = await this.reidratar(txn, listaPersistida.id);
        const estadoAnterior = lista.data.status;
        lista.exportar();
        await this.persistirTransicao(txn, lista, estadoAnterior, 'Arquivo JSON global gerado e compartilhado');
      }
    });

    return payloads;
  }

  /** Gera e compartilha o arquivo; a transição só é gravada depois do compartilhamento bem-sucedido. */
  static async exportar(db: SQLiteDatabase, listaId: number): Promise<PayloadRPA> {
    const listaParaExportacao = await this.reidratar(db, listaId);
    const payload = listaParaExportacao.exportar();
    await ExportacaoModel.exportarArquivo(payload);

    await db.withExclusiveTransactionAsync(async (txn) => {
      const lista = await this.reidratar(txn, listaId);
      const estadoAnterior = lista.data.status;
      lista.exportar();
      await this.persistirTransicao(txn, lista, estadoAnterior, 'Arquivo JSON gerado e compartilhado');
    });

    return payload;
  }

  static async deletar(db: SQLiteDatabase, listaId: number): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync('DELETE FROM listas WHERE id = ?', [listaId]);
    });
  }

  private static async reidratar(db: SQLiteDatabase, listaId: number): Promise<ListaRancho> {
    const cabecalho = await db.getFirstAsync<ListaPersistida>(`
      SELECT l.id, l.origem_id, d.codigo AS codigo_origem, l.escola_id,
             e.codigo_deposito AS codigo_destino, l.data_criacao, l.status
      FROM listas l
      JOIN depositos_origem d ON d.id = l.origem_id
      JOIN escolas e ON e.id = l.escola_id
      WHERE l.id = ?
    `, [listaId]);
    if (!cabecalho) throw new Error('Lista não encontrada.');

    const itens = await db.getAllAsync<ItemPersistido>(`
      SELECT i.codigo AS codigo_item, SUM(il.quantidade) AS quantidade
      FROM itens_lista il
      JOIN itens i ON i.id = il.produto_id
      WHERE il.lista_id = ?
      GROUP BY i.codigo
    `, [listaId]);

    return new ListaRancho({ ...cabecalho, itens });
  }

  private static async buscarItem(db: SQLiteDatabase, idItemLista: number): Promise<{ lista_id: number; codigo: string }> {
    const item = await db.getFirstAsync<{ lista_id: number; codigo: string }>(`
      SELECT il.lista_id, i.codigo
      FROM itens_lista il
      JOIN itens i ON i.id = il.produto_id
      WHERE il.id = ?
    `, [idItemLista]);
    if (!item) throw new Error('Item da lista não encontrado.');
    return item;
  }

  private static async persistirItens(db: SQLiteDatabase, lista: ListaRancho): Promise<void> {
    const listaId = lista.data.id;
    if (!listaId) throw new Error('Não é possível persistir uma lista sem identificador.');

    await db.runAsync('DELETE FROM itens_lista WHERE lista_id = ?', [listaId]);
    for (const item of lista.data.itens) {
      const produto = await db.getFirstAsync<{ id: number }>('SELECT id FROM itens WHERE codigo = ?', [item.codigo_item]);
      if (!produto) throw new Error(`Produto ${item.codigo_item} não encontrado.`);
      await db.runAsync(
        'INSERT INTO itens_lista (lista_id, produto_id, quantidade) VALUES (?, ?, ?)',
        [listaId, produto.id, item.quantidade]
      );
    }
  }

  private static async persistirTransicao(
    db: SQLiteDatabase,
    lista: ListaRancho,
    estadoAnterior: StatusLista,
    motivo: string
  ): Promise<void> {
    const listaId = lista.data.id;
    if (!listaId) throw new Error('Não é possível persistir uma lista sem identificador.');

    await db.runAsync('UPDATE listas SET status = ? WHERE id = ?', [lista.data.status, listaId]);
    await this.registrarTransicao(db, listaId, estadoAnterior, lista.data.status, motivo);
  }

  private static async registrarTransicao(
    db: SQLiteDatabase,
    listaId: number,
    estadoAnterior: string,
    estadoNovo: string,
    motivo: string
  ): Promise<void> {
    await db.runAsync(
      `INSERT INTO log_transicao (lista_rancho_id, estado_anterior, estado_novo, data_transicao, usuario, motivo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [listaId, estadoAnterior, estadoNovo, new Date().toISOString(), 'Operador_Local', motivo]
    );
  }
}
