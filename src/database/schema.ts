import * as SQLite from 'expo-sqlite';
import { SEED_ORIGENS, SEED_ESCOLAS, SEED_ITENS } from './seedData';

/**
 * Função responsável por criar e validar o Schema Relacional do TransferTool.
 * Garante as tabelas e chaves estrangeiras no padrão Offline-First.
 */
export async function setupDatabase(db: SQLite.SQLiteDatabase) {
  // Habilita configurações rigorosas para consistência e performance no Mobile
  await db.execAsync('PRAGMA journal_mode = WAL'); // Write-Ahead Logging (Performance)
  await db.execAsync('PRAGMA foreign_keys = ON');  // Habilita Integridade Referencial

  // Criar Tabelas
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS depositos_origem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      nome_busca TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS escolas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_deposito TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      nome_busca TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigos_erp TEXT NOT NULL CHECK(json_valid(codigos_erp) AND json_array_length(codigos_erp) > 0),
      descricao TEXT NOT NULL,
      descricao_busca TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS listas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origem_id INTEGER NOT NULL,
      escola_id INTEGER NOT NULL,
      data_criacao TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Rascunho', 'Consolidada', 'Exportada')),
      FOREIGN KEY(origem_id) REFERENCES depositos_origem(id),
      FOREIGN KEY(escola_id) REFERENCES escolas(id)
    );

    CREATE TABLE IF NOT EXISTS itens_lista (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lista_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      quantidade REAL NOT NULL,
      FOREIGN KEY(lista_id) REFERENCES listas(id) ON DELETE CASCADE,
      FOREIGN KEY(produto_id) REFERENCES itens(id)
    );

    -- Tabela de auditoria do ciclo de vida para o Padrão State
    CREATE TABLE IF NOT EXISTS log_transicao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lista_rancho_id INTEGER NOT NULL,
      estado_anterior TEXT NOT NULL,
      estado_novo TEXT NOT NULL,
      data_transicao TEXT NOT NULL,
      usuario TEXT NOT NULL,
      motivo TEXT,
      FOREIGN KEY(lista_rancho_id) REFERENCES listas(id) ON DELETE CASCADE
    );
  `);

  await removerColunasDeValidade(db);
  await adicionarColunaDepositoVinculado(db);
}

/** Remove campos obsoletos de bancos criados por versões anteriores do app. */
async function removerColunasDeValidade(db: SQLite.SQLiteDatabase) {
  const colunasItens = await db.getAllAsync<{ name: string }>('PRAGMA table_info(itens)');
  if (colunasItens.some(coluna => coluna.name === 'exige_validade')) {
    await db.execAsync('ALTER TABLE itens DROP COLUMN exige_validade');
  }

  const colunasItensLista = await db.getAllAsync<{ name: string }>('PRAGMA table_info(itens_lista)');
  if (colunasItensLista.some(coluna => coluna.name === 'data_validade')) {
    await db.execAsync('ALTER TABLE itens_lista DROP COLUMN data_validade');
  }
}

/**
 * Adiciona a coluna de "depósito vinculado" em `itens` (feature futura).
 * É apenas uma preparação de schema: nenhuma lógica de negócio a consome ainda.
 */
async function adicionarColunaDepositoVinculado(db: SQLite.SQLiteDatabase) {
  const colunasItens = await db.getAllAsync<{ name: string }>('PRAGMA table_info(itens)');
  if (!colunasItens.some(coluna => coluna.name === 'deposito_id')) {
    await db.execAsync('ALTER TABLE itens ADD COLUMN deposito_id INTEGER REFERENCES depositos_origem(id)');
  }
}

/**
 * Função utilitária para remover acentos e caracteres especiais para as colunas de busca.
 */
function removeAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Insere os dados base para a operação do aplicativo (Mock/Seed pré-populado).
 */
export async function seedDatabase(db: SQLite.SQLiteDatabase) {
  // Verifica se o banco já foi populado checando o depósito
  const result = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM depositos_origem');
  if (result && result.count > 0) {
    return; // Banco já possui os dados iniciais
  }

  console.log('Populando banco com dados reais (Seed Oficial)...');

  // 1. Popular Depósitos de Origem
  for (const origem of SEED_ORIGENS) {
    await db.runAsync(
      'INSERT INTO depositos_origem (codigo, nome, nome_busca) VALUES (?, ?, ?)', 
      [origem.codigo, origem.nome, removeAcentos(origem.nome)]
    );
  }

  // 2. Popular Destinos (Escolas)
  for (const escola of SEED_ESCOLAS) {
    await db.runAsync(
      'INSERT INTO escolas (codigo_deposito, nome, nome_busca) VALUES (?, ?, ?)', 
      [escola.codigo, escola.nome, removeAcentos(escola.nome)]
    );
  }
  
  // 3. Popular Itens (Catálogo sem quantidade) — códigos normalizados em array
  for (const item of SEED_ITENS) {
    const codigos = String(item.codigo).split(',').map(c => c.trim()).filter(Boolean);
    await db.runAsync(
      'INSERT INTO itens (codigos_erp, descricao, descricao_busca) VALUES (?, ?, ?)',
      [JSON.stringify(codigos), item.descricao, removeAcentos(item.descricao)]
    );
  }
  
  console.log('Seed Finalizado com Sucesso!');
}
