import { SQLiteDatabase } from 'expo-sqlite';

export interface ProdutoCatalogo {
  id: number;
  codigo: string;
  descricao: string;
  exige_validade: number;
}

export interface ItemCarrinho {
  id: number;
  produto_id: number;
  descricao: string;
  codigo: string;
  quantidade: number;
  data_validade?: string;
  exige_validade: number;
}

export class ItemModel {
  /** Busca itens no catálogo pelo código ou descrição */
  static async buscarCatalogo(db: SQLiteDatabase, query: string, queryUnaccented: string): Promise<ProdutoCatalogo[]> {
    return await db.getAllAsync<ProdutoCatalogo>(
      `SELECT id, codigo, descricao, exige_validade FROM itens WHERE (descricao LIKE ? OR descricao_busca LIKE ? OR codigo LIKE ?) AND ativo = 1 LIMIT 5`,
      [`%${query}%`, `%${queryUnaccented}%`, `%${query}%`]
    );
  }

  /** Busca todos os itens que já foram adicionados a uma lista específica */
  static async getItensCarrinho(db: SQLiteDatabase, listaId: number): Promise<ItemCarrinho[]> {
    return await db.getAllAsync<ItemCarrinho>(`
      SELECT il.id, il.produto_id, i.descricao, i.codigo, il.quantidade, il.data_validade, i.exige_validade
      FROM itens_lista il
      JOIN itens i ON il.produto_id = i.id
      WHERE il.lista_id = ?
      ORDER BY il.id DESC
    `, [listaId]);
  }

  /** Insere um novo item no carrinho, garantindo que a lista esteja em Rascunho */
  static async adicionar(db: SQLiteDatabase, listaId: number, produtoId: number, qtd: number, validade?: string | null): Promise<void> {
    const lista = await db.getFirstAsync<{ status: string }>(`SELECT status FROM listas WHERE id = ?`, [listaId]);
    if (lista?.status !== 'Rascunho') throw new Error("Apenas listas em Rascunho podem receber novos itens.");

    await db.runAsync(
      `INSERT INTO itens_lista (lista_id, produto_id, quantidade, data_validade) VALUES (?, ?, ?, ?)`,
      [listaId, produtoId, qtd, validade || null]
    );
  }

  /** Atualiza quantidade ou validade, validando o estado da lista pai */
  static async atualizar(db: SQLiteDatabase, idItemLista: number, qtd: number, validade?: string | null): Promise<void> {
    const item = await db.getFirstAsync<{ lista_id: number }>(`SELECT lista_id FROM itens_lista WHERE id = ?`, [idItemLista]);
    if (!item) return;

    const lista = await db.getFirstAsync<{ status: string }>(`SELECT status FROM listas WHERE id = ?`, [item.lista_id]);
    if (lista?.status !== 'Rascunho') throw new Error("Não é possível editar itens de uma lista consolidada.");

    await db.runAsync(
      `UPDATE itens_lista SET quantidade = ?, data_validade = ? WHERE id = ?`,
      [qtd, validade || null, idItemLista]
    );
  }

  /** Remove um item, validando o estado da lista pai */
  static async remover(db: SQLiteDatabase, idItemLista: number): Promise<void> {
    const item = await db.getFirstAsync<{ lista_id: number }>(`SELECT lista_id FROM itens_lista WHERE id = ?`, [idItemLista]);
    if (!item) return;

    const lista = await db.getFirstAsync<{ status: string }>(`SELECT status FROM listas WHERE id = ?`, [item.lista_id]);
    if (lista?.status !== 'Rascunho') throw new Error("Não é possível remover itens de uma lista consolidada.");

    await db.runAsync(`DELETE FROM itens_lista WHERE id = ?`, [idItemLista]);
  }
}
