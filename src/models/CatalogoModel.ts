import * as SQLite from 'expo-sqlite';
import { normalizeSearch } from '../utils/stringUtils';

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
  fracionado?: number;
  valor_fracionado?: number | null;
}

/**
 * Modelo responsável pelas operações de CRUD e gerenciamento do catálogo local.
 * Segue o padrão MVC isolando a lógica de banco de dados.
 */
export class CatalogoModel {
  


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
      case 'item': return { code: 'codigos_erp', name: 'descricao', search: 'descricao_busca' };
    }
  }

  /**
   * Valida códigos de catálogo contra caracteres suspeitos e tamanho máximo,
   * alinhado à validação do TransferToolRPA (que rejeita payloads inválidos).
   */
  private static validarCodigos(codigo: string | string[]): void {
    const lista = Array.isArray(codigo) ? codigo : [codigo];
    const suspeitos = ['..', '/', '\\', ';', "'", '"', '<', '>', '\n', '\r'];

    for (const codigoBruto of lista) {
      const limpo = (codigoBruto ?? '').trim();
      if (!limpo) throw new Error('Código não pode ser vazio.');
      if (limpo.length > 50) throw new Error(`Código "${limpo}" excede 50 caracteres.`);

      for (const caractere of suspeitos) {
        if (limpo.includes(caractere)) {
          throw new Error(`Código "${limpo}" contém caractere inválido.`);
        }
      }
    }
  }

  /**
   * Lista itens do catálogo baseados no status ativo/inativo
   */
  static async listar(db: SQLite.SQLiteDatabase, entidade: EntidadeCatalogo, ativo: boolean): Promise<ItemCatalogo[]> {
    const table = this.getTable(entidade);
    const cols = this.getColumnNames(entidade);
    const status = ativo ? 1 : 0;
    const colunasExtras = entidade === 'item' ? ', fracionado, valor_fracionado' : '';

    const query = `
      SELECT id, ${cols.code} as codigo, ${cols.name} as nome, ativo${colunasExtras} 
      FROM ${table} 
      WHERE ativo = ? 
      ORDER BY ${cols.name} ASC
    `;
    
    return await db.getAllAsync<ItemCatalogo>(query, [status]);
  }

  /**
   * Adiciona um novo registro ao catálogo
   */
  static async adicionar(db: SQLite.SQLiteDatabase, entidade: EntidadeCatalogo, codigo: string | string[], nome: string, opcoes?: { fracionado?: boolean; valorFracionado?: number | null }): Promise<void> {
    const nomeNormalizado = nome.trim();
    if (!codigo || (Array.isArray(codigo) && codigo.length === 0) || !nomeNormalizado) {
      throw new Error('Código e nome são obrigatórios.');
    }
    this.validarCodigos(codigo);

    const table = this.getTable(entidade);
    const cols = this.getColumnNames(entidade);
    const nomeBusca = normalizeSearch(nomeNormalizado);
    
    let codigoFormatado = Array.isArray(codigo) ? JSON.stringify(codigo.map(c => c.trim())) : codigo.trim();

    if (entidade === 'item' && !Array.isArray(codigo)) {
      codigoFormatado = JSON.stringify([codigo.trim()]);
    }

    if (entidade === 'item') {
      const query = `
        INSERT INTO ${table} (${cols.code}, ${cols.name}, ${cols.search}, fracionado, valor_fracionado, ativo)
        VALUES (?, ?, ?, ?, ?, 1)
      `;
      const fracionado = opcoes?.fracionado ? 1 : 0;
      const valorFracionado = opcoes?.fracionado ? opcoes.valorFracionado ?? null : null;
      await db.runAsync(query, [codigoFormatado, nomeNormalizado, nomeBusca, fracionado, valorFracionado]);
      return;
    }

    const query = `
      INSERT INTO ${table} (${cols.code}, ${cols.name}, ${cols.search}, ativo)
      VALUES (?, ?, ?, 1)
    `;

    await db.runAsync(query, [codigoFormatado, nomeNormalizado, nomeBusca]);
  }

  /**
   * Edita um registro existente
   */
  static async editar(db: SQLite.SQLiteDatabase, entidade: EntidadeCatalogo, id: number, codigo: string | string[], nome: string, opcoes?: { fracionado?: boolean; valorFracionado?: number | null }): Promise<void> {
    const nomeNormalizado = nome.trim();
    if (!codigo || (Array.isArray(codigo) && codigo.length === 0) || !nomeNormalizado) {
      throw new Error('Código e nome são obrigatórios.');
    }
    this.validarCodigos(codigo);

    const table = this.getTable(entidade);
    const cols = this.getColumnNames(entidade);
    const nomeBusca = normalizeSearch(nomeNormalizado);
    
    let codigoFormatado = Array.isArray(codigo) ? JSON.stringify(codigo.map(c => c.trim())) : codigo.trim();

    if (entidade === 'item' && !Array.isArray(codigo)) {
      codigoFormatado = JSON.stringify([codigo.trim()]);
    }

    if (entidade === 'item') {
      const query = `
        UPDATE ${table}
        SET ${cols.code} = ?, ${cols.name} = ?, ${cols.search} = ?, fracionado = ?, valor_fracionado = ?
        WHERE id = ?
      `;
      const fracionado = opcoes?.fracionado ? 1 : 0;
      const valorFracionado = opcoes?.fracionado ? opcoes.valorFracionado ?? null : null;
      await db.runAsync(query, [codigoFormatado, nomeNormalizado, nomeBusca, fracionado, valorFracionado, id]);
      return;
    }

    const query = `
      UPDATE ${table}
      SET ${cols.code} = ?, ${cols.name} = ?, ${cols.search} = ?
      WHERE id = ?
    `;

    await db.runAsync(query, [codigoFormatado, nomeNormalizado, nomeBusca, id]);
  }

  /**
   * Altera o status (ativo/inativo) de múltiplos itens em lote
   */
  static async alterarStatusLote(db: SQLite.SQLiteDatabase, entidade: EntidadeCatalogo, ids: number[], novoStatus: 0 | 1): Promise<void> {
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
