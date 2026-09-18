import { CatalogoModel } from '../models/CatalogoModel';
import { SQLiteDatabase } from 'expo-sqlite';

// Mock do SQLiteDatabase
const mockDb = {
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
} as unknown as SQLiteDatabase;

describe('CatalogoModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('deve chamar a query correta para listar itens ativos de deposito', async () => {
      (mockDb.getAllAsync as jest.Mock).mockResolvedValue([]);
      
      await CatalogoModel.listar(mockDb, 'deposito', true);
      
      const query = (mockDb.getAllAsync as jest.Mock).mock.calls[0][0];
      expect(query).toMatch(/FROM\s+depositos_origem\s+WHERE\s+ativo\s+=\s+\?/);
      expect((mockDb.getAllAsync as jest.Mock).mock.calls[0][1]).toEqual([1]);
    });

    it('deve chamar a query correta para listar itens inativos de escola', async () => {
      (mockDb.getAllAsync as jest.Mock).mockResolvedValue([]);
      
      await CatalogoModel.listar(mockDb, 'escola', false);
      
      const query = (mockDb.getAllAsync as jest.Mock).mock.calls[0][0];
      expect(query).toMatch(/FROM\s+escolas\s+WHERE\s+ativo\s+=\s+\?/);
      expect((mockDb.getAllAsync as jest.Mock).mock.calls[0][1]).toEqual([0]);
    });
  });

  describe('adicionar', () => {
    it('deve inserir item com normalização de busca', async () => {
      await CatalogoModel.adicionar(mockDb, 'item', 'COD-01', 'Arroz Agulhinha');
      
      const query = (mockDb.runAsync as jest.Mock).mock.calls[0][0];
      expect(query).toMatch(/INSERT\s+INTO\s+itens/);
      expect((mockDb.runAsync as jest.Mock).mock.calls[0][1]).toEqual(['["COD-01"]', 'Arroz Agulhinha', 'arroz agulhinha']);
    });

    it('deve normalizar nomes com acentos corretamente', async () => {
      await CatalogoModel.adicionar(mockDb, 'deposito', 'DEP-01', 'Depósito Central');
      
      const query = (mockDb.runAsync as jest.Mock).mock.calls[0][0];
      expect(query).toMatch(/INSERT\s+INTO\s+depositos_origem/);
      expect((mockDb.runAsync as jest.Mock).mock.calls[0][1]).toEqual(['DEP-01', 'Depósito Central', 'deposito central']);
    });
  });

  describe('alterarStatusLote', () => {
    it('deve atualizar múltiplos itens em lote', async () => {
      const ids = [1, 2, 3];
      await CatalogoModel.alterarStatusLote(mockDb, 'item', ids, 0);
      
      const query = (mockDb.runAsync as jest.Mock).mock.calls[0][0];
      expect(query).toMatch(/UPDATE\s+itens\s+SET\s+ativo\s+=\s+\?\s+WHERE\s+id\s+IN\s+\(\?,\?,\?\)/);
      expect((mockDb.runAsync as jest.Mock).mock.calls[0][1]).toEqual([0, 1, 2, 3]);
    });

    it('não deve fazer nada se a lista de ids estiver vazia', async () => {
      await CatalogoModel.alterarStatusLote(mockDb, 'item', [], 0);
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });
});
