import type { SQLiteDatabase } from 'expo-sqlite';
import type { StatusLista } from './interfaces';

export interface ListaHist {
  id: number;
  status: StatusLista;
  data_criacao: string;
  origem_codigo: string;
  destino_codigo: string;
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
      SELECT l.id, l.status, l.data_criacao,
             o.codigo AS origem_codigo, e.codigo_deposito AS destino_codigo,
             o.nome AS origem_nome, e.nome AS destino_nome
      FROM listas l
      JOIN depositos_origem o ON l.origem_id = o.id
      JOIN escolas e ON l.escola_id = e.id
      ORDER BY l.id DESC
    `);
  }

}
