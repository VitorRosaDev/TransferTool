import { SQLiteDatabase } from 'expo-sqlite';

export interface ListaHist {
  id: number;
  status: string;
  data_criacao: string;
  origem_nome: string;
  destino_nome: string;
}

export interface ListaDetalhes {
  id: number;
  status: string;
  origem_nome: string;
  destino_nome: string;
}

export interface Suggestion {
  id: number;
  codigo?: string;
  codigo_deposito?: string;
  nome: string;
}

export class ListaModel {
  /** Busca depósitos de origem normalizando a string */
  static async buscarOrigens(db: SQLiteDatabase, query: string, queryUnaccented: string): Promise<Suggestion[]> {
    return await db.getAllAsync<Suggestion>(
      `SELECT id, codigo, nome FROM depositos_origem WHERE (nome LIKE ? OR nome_busca LIKE ? OR codigo LIKE ?) AND ativo = 1`,
      [`%${query}%`, `%${queryUnaccented}%`, `%${query}%`]
    );
  }

  /** Busca escolas de destino normalizando a string */
  static async buscarDestinos(db: SQLiteDatabase, query: string, queryUnaccented: string): Promise<Suggestion[]> {
    return await db.getAllAsync<Suggestion>(
      `SELECT id, codigo_deposito, nome FROM escolas WHERE (nome LIKE ? OR nome_busca LIKE ? OR codigo_deposito LIKE ?) AND ativo = 1`,
      [`%${query}%`, `%${queryUnaccented}%`, `%${query}%`]
    );
  }

  /** Cria o rascunho de uma nova lista e registra o log inicial */
  static async criarRascunho(db: SQLiteDatabase, origemId: number, destinoId: number): Promise<number> {
    const dataCriacao = new Date().toISOString();
    
    // Insere Lista
    const resultLista = await db.runAsync(
      `INSERT INTO listas (origem_id, escola_id, data_criacao, status) VALUES (?, ?, ?, ?)`,
      [origemId, destinoId, dataCriacao, 'Rascunho']
    );
    const novaListaId = resultLista.lastInsertRowId;

    // Registra o Estado Inicial
    await db.runAsync(
      `INSERT INTO log_transicao (lista_rancho_id, estado_anterior, estado_novo, data_transicao, usuario, motivo) VALUES (?, ?, ?, ?, ?, ?)`,
      [novaListaId, 'Nenhum', 'Rascunho', dataCriacao, 'Operador_Local', 'Criação inicial da lista']
    );

    return novaListaId;
  }

  /** Puxa histórico reverso de todas as listas criadas */
  static async getHistorico(db: SQLiteDatabase): Promise<ListaHist[]> {
    return await db.getAllAsync<ListaHist>(`
      SELECT l.id, l.status, l.data_criacao, o.nome as origem_nome, e.nome as destino_nome 
      FROM listas l
      JOIN depositos_origem o ON l.origem_id = o.id
      JOIN escolas e ON l.escola_id = e.id
      ORDER BY l.id DESC
    `);
  }

  /** Carrega os detalhes do cabeçalho da lista (Origem -> Destino) */
  static async getDetalhes(db: SQLiteDatabase, listaId: number): Promise<ListaDetalhes | null> {
    return await db.getFirstAsync<ListaDetalhes>(`
      SELECT l.id, l.status, o.nome as origem_nome, e.nome as destino_nome
      FROM listas l
      JOIN depositos_origem o ON l.origem_id = o.id
      JOIN escolas e ON l.escola_id = e.id
      WHERE l.id = ?
    `, [listaId]);
  }

  /** Muda o status para consolidada e registra a transição de estado */
  static async consolidar(db: SQLiteDatabase, listaId: number): Promise<void> {
    const dataConsolidacao = new Date().toISOString();
    
    // Altera Status Principal
    await db.runAsync(`UPDATE listas SET status = 'Consolidada' WHERE id = ?`, [listaId]);

    // Registra a Mudança de Estado
    await db.runAsync(
      `INSERT INTO log_transicao (lista_rancho_id, estado_anterior, estado_novo, data_transicao, usuario, motivo) VALUES (?, ?, ?, ?, ?, ?)`,
      [listaId, 'Rascunho', 'Consolidada', dataConsolidacao, 'Operador_Local', 'Carga finalizada fisicamente no coletor']
    );
  }

  /** Deleta uma lista inteira e todos os relacionamentos em cascata */
  static async deletar(db: SQLiteDatabase, listaId: number): Promise<void> {
    // Força a deleção para garantir limpeza de lixo caso o PRAGMA ON DELETE CASCADE falhe
    await db.runAsync(`DELETE FROM itens_lista WHERE lista_id = ?`, [listaId]);
    await db.runAsync(`DELETE FROM log_transicao WHERE lista_rancho_id = ?`, [listaId]);
    await db.runAsync(`DELETE FROM listas WHERE id = ?`, [listaId]);
  }
}
