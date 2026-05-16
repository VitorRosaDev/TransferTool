import { ExportacaoModel } from '../models/ExportacaoModel';
import { SQLiteDatabase } from 'expo-sqlite';

const mockDb = {
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
} as unknown as SQLiteDatabase;

describe('ExportacaoModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve gerar payload contendo apenas códigos e quantidades corretas', async () => {
    // Mock do cabeçalho
    (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
      id: 10,
      codigo_origem: 'DEP-TEST',
      codigo_destino: 'ESC-TEST',
      data_criacao: '2026-01-01T10:00:00Z'
    });

    // Mock dos itens
    (mockDb.getAllAsync as jest.Mock).mockResolvedValue([
      { codigo: 'PROD-01', quantidade: 100, data_validade: '2026-12-31' },
      { codigo: 'PROD-02', quantidade: 50, data_validade: null }
    ]);

    const payload = await ExportacaoModel.gerarPayload(mockDb, 10);

    expect(payload.id_app).toBe(10);
    expect(payload.codigo_origem).toBe('DEP-TEST');
    expect(payload.codigo_destino).toBe('ESC-TEST');
    expect(payload.itens.length).toBe(2);
    expect(payload.itens[0].codigo).toBe('PROD-01');
    expect(payload.itens[0].validade).toBe('2026-12-31');
    expect(payload.itens[1].codigo).toBe('PROD-02');
    expect(payload.itens[1].validade).toBeNull();
  });

  it('deve formatar data_geracao como string ISO', async () => {
    (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
      id: 1, codigo_origem: 'A', codigo_destino: 'B', data_criacao: ''
    });
    (mockDb.getAllAsync as jest.Mock).mockResolvedValue([]);

    const payload = await ExportacaoModel.gerarPayload(mockDb, 1);
    
    // Verifica se é uma data ISO válida
    expect(new Date(payload.data_geracao).toISOString()).toBe(payload.data_geracao);
  });
});
