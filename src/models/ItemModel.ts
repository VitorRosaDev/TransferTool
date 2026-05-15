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

  /** Insere um novo item no carrinho */
  static async adicionar(db: SQLiteDatabase, listaId: number, produtoId: number, qtd: number, validade?: string | null): Promise<void> {
    await db.runAsync(
      `INSERT INTO itens_lista (lista_id, produto_id, quantidade, data_validade) VALUES (?, ?, ?, ?)`,
      [listaId, produtoId, qtd, validade || null]
    );
  }

  /** Atualiza quantidade ou validade de um item já inserido no carrinho */
  static async atualizar(db: SQLiteDatabase, idItemLista: number, qtd: number, validade?: string | null): Promise<void> {
    await db.runAsync(
      `UPDATE itens_lista SET quantidade = ?, data_validade = ? WHERE id = ?`,
      [qtd, validade || null, idItemLista]
    );
  }

  /** Remove um item específico do carrinho */
  static async remover(db: SQLiteDatabase, idItemLista: number): Promise<void> {
    await db.runAsync(`DELETE FROM itens_lista WHERE id = ?`, [idItemLista]);
  }
}
