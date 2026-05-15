import * as SQLite from 'expo-sqlite';

/**
 * Tipos de entidades gerenciáveis no catálogo
 */
export type EntidadeCatalogo = 'deposito' | 'escola' | 'item';

/**
 * Interface genérica para itens do catálogo (Depósitos, Escolas ou Itens)
 */
export interface ItemCatalogo {
  id: number;
  codigo: string;
  nome: string;
  ativo: number;
}

/**
 * Modelo responsável pelas operações de CRUD e gerenciamento do catálogo local.
 * Segue o padrão MVC isolando a lógica de banco de dados.
 */
export class CatalogoModel {
  
  /**
   * Remove acentos e normaliza para busca
   */
  private static normalizeSearch(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /**
   * Retorna a tabela correta para a categoria informada
   */
  private static getTable(entidade: EntidadeCatalogo): string {
    switch (entidade) {
      case 'deposito': return 'depositos_origem';
      case 'escola': return 'escolas';
      case 'item': return 'itens';
    }
  }

  /**
   * Retorna os nomes das colunas de código e nome baseados na entidade
   */
  private static getColumnNames(entidade: EntidadeCatalogo): { code: string, name: string, search: string } {
    switch (entidade) {
      case 'deposito': return { code: 'codigo', name: 'nome', search: 'nome_busca' };
      case 'escola': return { code: 'codigo_deposito', name: 'nome', search: 'nome_busca' };
      case 'item': return { code: 'codigo', name: 'descricao', search: 'descricao_busca' };
    }
  }

  /**
   * Lista itens do catálogo baseados no status ativo/inativo
   */
  static async listar(db: SQLite.SQLiteDatabase, entidade: EntidadeCatalogo, ativo: boolean): Promise<ItemCatalogo[]> {
    const table = this.getTable(entidade);
    const cols = this.getColumnNames(entidade);
    const status = ativo ? 1 : 0;

    const query = `
      SELECT id, ${cols.code} as codigo, ${cols.name} as nome, ativo 
      FROM ${table} 
      WHERE ativo = ? 
      ORDER BY ${cols.name} ASC
    `;
    
    return await db.getAllAsync<ItemCatalogo>(query, [status]);
  }

  /**
   * Adiciona um novo registro ao catálogo
   */
  static async adicionar(db: SQLite.SQLiteDatabase, entidade: EntidadeCatalogo, codigo: string, nome: string): Promise<void> {
    const table = this.getTable(entidade);
    const cols = this.getColumnNames(entidade);
    const nomeBusca = this.normalizeSearch(nome);

    const query = `
      INSERT INTO ${table} (${cols.code}, ${cols.name}, ${cols.search}, ativo) 
      VALUES (?, ?, ?, 1)
    `;

    await db.runAsync(query, [codigo, nome, nomeBusca]);
  }

  /**
   * Altera o status (ativo/inativo) de múltiplos itens em lote
   */
  static async alterarStatusLote(db: SQLite.SQLiteDatabase, entidade: EntidadeCatalogo, ids: number[], novoStatus: number): Promise<void> {
    if (ids.length === 0) return;

    const table = this.getTable(entidade);
    const placeholders = ids.map(() => '?').join(',');
    
    const query = `
      UPDATE ${table} 
      SET ativo = ? 
      WHERE id IN (${placeholders})
    `;

    await db.runAsync(query, [novoStatus, ...ids]);
  }
}
