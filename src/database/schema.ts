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
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS escolas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_deposito TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      descricao TEXT NOT NULL,
      exige_validade INTEGER NOT NULL DEFAULT 1, -- 1 = TRUE, 0 = FALSE
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
      data_validade TEXT,
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
    await db.runAsync('INSERT INTO depositos_origem (codigo, nome) VALUES (?, ?)', [origem.codigo, origem.nome]);
  }

  // 2. Popular Destinos (Escolas)
  for (const escola of SEED_ESCOLAS) {
    await db.runAsync('INSERT INTO escolas (codigo_deposito, nome) VALUES (?, ?)', [escola.codigo, escola.nome]);
  }
  
  // 3. Popular Itens (Catálogo sem quantidade)
  for (const item of SEED_ITENS) {
    await db.runAsync('INSERT INTO itens (codigo, descricao, exige_validade) VALUES (?, ?, ?)', [item.codigo, item.descricao, item.exige_validade]);
  }
  
  console.log('Seed Finalizado com Sucesso!');
}
