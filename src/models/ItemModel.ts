import type { SQLiteDatabase } from 'expo-sqlite';

export interface ProdutoCatalogo {
  id: number;
  codigos_erp: string;
  descricao: string;
}

export interface ItemCarrinho {
  id: number;
  produto_id: number;
  descricao: string;
  codigos_erp: string;
  quantidade: number;
}

export class ItemModel {
  /** Busca itens no catálogo pelo código ou descrição */
  static async buscarCatalogo(db: SQLiteDatabase, query: string, queryUnaccented: string): Promise<ProdutoCatalogo[]> {
    return await db.getAllAsync<ProdutoCatalogo>(
      `SELECT id, codigos_erp, descricao FROM itens WHERE (descricao LIKE ? OR descricao_busca LIKE ? OR EXISTS (SELECT 1 FROM json_each(codigos_erp) WHERE value LIKE ?)) AND ativo = 1 LIMIT 5`,
      [`%${query}%`, `%${queryUnaccented}%`, `%${query}%`]
    );
  }

  /** Busca todos os itens que já foram adicionados a uma lista específica */
  static async getItensCarrinho(db: SQLiteDatabase, listaId: number): Promise<ItemCarrinho[]> {
    return await db.getAllAsync<ItemCarrinho>(`
      SELECT il.id, il.produto_id, i.descricao, i.codigos_erp, il.quantidade
      FROM itens_lista il
      JOIN itens i ON il.produto_id = i.id
      WHERE il.lista_id = ?
      ORDER BY il.id DESC
    `, [listaId]);
  }

}
