import { SQLiteDatabase } from 'expo-sqlite';
import { ListaRanchoService } from '../models/ListaRanchoService';
import { ExportacaoModel } from '../models/ExportacaoModel';

const mockDb = {
  withExclusiveTransactionAsync: jest.fn(async (task) => task(mockDb)),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
} as unknown as SQLiteDatabase;

describe('ListaRanchoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
      id: 7,
      origem_id: 1,
      codigo_origem: 'DEP-01',
      nome_origem: 'DEP-01',
      escola_id: 2,
      codigo_destino: 'ESC-01',
      data_criacao: '2026-01-01T10:00:00.000Z',
      status: 'Rascunho',
    });
    (mockDb.getAllAsync as jest.Mock).mockResolvedValue([
      { produto_id: 1, codigos_erp: '["ITEM-01"]', quantidade: 10 },
    ]);
    (mockDb.runAsync as jest.Mock).mockResolvedValue({ lastInsertRowId: 7 });
  });

  it('reidrata a lista, delega a consolidação ao State e persiste a transição na transação', async () => {
    await ListaRanchoService.consolidar(mockDb, 7);

    expect(mockDb.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(mockDb.runAsync).toHaveBeenNthCalledWith(
      1,
      'UPDATE listas SET status = ? WHERE id = ?',
      ['Consolidada', 7]
    );
    expect(mockDb.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO log_transicao'),
      expect.arrayContaining([7, 'Rascunho', 'Consolidada'])
    );
  });

  it('reabre uma lista consolidada e registra a transição na transação', async () => {
    (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
      id: 7,
      origem_id: 1,
      codigo_origem: 'DEP-01',
      nome_origem: 'DEP-01',
      escola_id: 2,
      codigo_destino: 'ESC-01',
      data_criacao: '2026-01-01T10:00:00.000Z',
      status: 'Consolidada',
    });

    await ListaRanchoService.reabrir(mockDb, 7);

    expect(mockDb.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(mockDb.runAsync).toHaveBeenNthCalledWith(
      1,
      'UPDATE listas SET status = ? WHERE id = ?',
      ['Rascunho', 7]
    );
    expect(mockDb.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO log_transicao'),
      expect.arrayContaining([7, 'Consolidada', 'Rascunho'])
    );
  });

  it('permite exclusão física da lista em qualquer estado', async () => {
    await ListaRanchoService.deletar(mockDb, 7);

    expect(mockDb.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'DELETE FROM listas WHERE id = ?',
      [7]
    );
  });

  it('exporta em um único arquivo as listas consolidadas e exportadas', async () => {
    const exportarArquivo = jest.spyOn(ExportacaoModel, 'exportarArquivo').mockResolvedValue();
    (mockDb.getAllAsync as jest.Mock)
      .mockResolvedValueOnce([
        { id: 7, status: 'Consolidada' },
        { id: 8, status: 'Exportada' },
      ])
      .mockResolvedValue([{ produto_id: 1, codigos_erp: '["ITEM-01"]', descricao: 'ITEM TESTE', quantidade: 10 }]);
    (mockDb.getFirstAsync as jest.Mock)
      .mockResolvedValueOnce({
        id: 7,
        origem_id: 1,
        codigo_origem: 'DEP-01',
        nome_origem: 'DEP-01',
        escola_id: 2,
        codigo_destino: 'ESC-01',
        data_criacao: '2026-01-01T10:00:00.000Z',
        status: 'Consolidada',
      })
      .mockResolvedValueOnce({
        id: 8,
        origem_id: 1,
        codigo_origem: 'DEP-01',
        nome_origem: 'DEP-01',
        escola_id: 2,
        codigo_destino: 'ESC-02',
        data_criacao: '2026-01-02T10:00:00.000Z',
        status: 'Exportada',
      })
      .mockResolvedValueOnce({
        id: 7,
        origem_id: 1,
        codigo_origem: 'DEP-01',
        nome_origem: 'DEP-01',
        escola_id: 2,
        codigo_destino: 'ESC-01',
        data_criacao: '2026-01-01T10:00:00.000Z',
        status: 'Consolidada',
      });

    const payloads = await ListaRanchoService.exportarTodas(mockDb);

    expect(payloads).toHaveLength(2);
    expect(exportarArquivo).toHaveBeenCalledWith(payloads, 'DEP-01');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'UPDATE listas SET status = ? WHERE id = ?',
      ['Exportada', 7]
    );
    exportarArquivo.mockRestore();
  });
});
