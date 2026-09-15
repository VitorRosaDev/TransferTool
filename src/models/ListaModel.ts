import type { SQLiteDatabase } from 'expo-sqlite';
import type { StatusLista } from './interfaces';

export interface ListaHist {
  id: number;
  status: StatusLista;
  data_criacao: string;
  origem_nome: string;
  destino_nome: string;
}

export interface ListaDetalhes {
  id: number;
  status: StatusLista;
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
      `SELECT id, codigo, nome FROM depositos_origem WHERE (nome LIKE ? OR nome_busca LIKE ? OR codigo LIKE ?) AND ativo = 1 LIMIT 5`,
      [`%${query}%`, `%${queryUnaccented}%`, `%${query}%`]
    );
  }

  /** Busca escolas de destino normalizando a string */
  static async buscarDestinos(db: SQLiteDatabase, query: string, queryUnaccented: string): Promise<Suggestion[]> {
    return await db.getAllAsync<Suggestion>(
      `SELECT id, codigo_deposito, nome FROM escolas WHERE (nome LIKE ? OR nome_busca LIKE ? OR codigo_deposito LIKE ?) AND ativo = 1 LIMIT 5`,
      [`%${query}%`, `%${queryUnaccented}%`, `%${query}%`]
    );
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

}
