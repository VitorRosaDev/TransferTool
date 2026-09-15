import { SQLiteDatabase } from 'expo-sqlite';
import { ListaModel } from '../models/ListaModel';

const mockDb = {
  getAllAsync: jest.fn(),
} as unknown as SQLiteDatabase;

describe('ListaModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna os códigos e nomes de origem e destino no histórico', async () => {
    const historico = [{
      id: 1,
      status: 'Rascunho',
      data_criacao: '2026-09-15T10:00:00.000Z',
      origem_codigo: 'DEP-01',
      destino_codigo: 'ESC-01',
      origem_nome: 'Depósito de Origem',
      destino_nome: 'Escola de Destino',
    }];
    (mockDb.getAllAsync as jest.Mock).mockResolvedValue(historico);

    const result = await ListaModel.getHistorico(mockDb);

    const query = (mockDb.getAllAsync as jest.Mock).mock.calls[0][0];
    expect(query).toMatch(/o\.codigo\s+AS\s+origem_codigo/i);
    expect(query).toMatch(/e\.codigo_deposito\s+AS\s+destino_codigo/i);
    expect(query).toMatch(/o\.nome\s+AS\s+origem_nome/i);
    expect(query).toMatch(/e\.nome\s+AS\s+destino_nome/i);
    expect(result[0]).toMatchObject({
      origem_codigo: 'DEP-01',
      destino_codigo: 'ESC-01',
      origem_nome: 'Depósito de Origem',
      destino_nome: 'Escola de Destino',
    });
  });
});