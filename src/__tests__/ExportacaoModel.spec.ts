import { ExportacaoModel } from '../models/ExportacaoModel';
import { ListaRancho } from '../models/ListaRancho';

describe('ExportacaoModel', () => {
  it('deve gerar o payload pelo State da lista consolidada', () => {
    const lista = new ListaRancho({
      id: 10,
      origem_id: 1,
      codigo_origem: 'DEP-TEST',
      nome_origem: 'DEP-TEST',
      escola_id: 2,
      codigo_destino: 'ESC-TEST',
      data_criacao: '2026-01-01T10:00:00Z',
      status: 'Consolidada',
      itens: [
        { produto_id: 1, codigos_erp: ['PROD-01'], descricao: 'Produto A', quantidade: 100 },
        { produto_id: 2, codigos_erp: ['PROD-02'], descricao: 'Produto B', quantidade: 50 },
      ],
    });

    const payload = lista.gerarPayload();

    expect(payload.id_app).toBe(10);
    expect(payload.codigo_origem).toBe('DEP-TEST');
    expect(payload.codigo_destino).toBe('ESC-TEST');
    expect(payload.itens.length).toBe(2);
    expect(payload.itens[0].codigos).toEqual(['PROD-01']);
    expect(payload.itens[0].descricao).toBe('Produto A');
    expect(payload.itens[1].codigos).toEqual(['PROD-02']);
  });

  it('deve formatar data_geracao como string ISO', () => {
    const lista = new ListaRancho({
      id: 1,
      origem_id: 1,
      codigo_origem: 'A',
      nome_origem: 'A',
      escola_id: 2,
      codigo_destino: 'B',
      data_criacao: '',
      status: 'Consolidada',
      itens: [{ produto_id: 1, codigos_erp: ['ITEM-01'], quantidade: 1 }],
    });

    const payload = lista.gerarPayload();
    
    // Verifica se é uma data ISO válida
    expect(new Date(payload.data_geracao).toISOString()).toBe(payload.data_geracao);
  });

  it('deve normalizar códigos agrupados por vírgula e incluir a descrição no payload', () => {
    const lista = new ListaRancho({
      id: 5,
      origem_id: 1,
      codigo_origem: 'DEP-01',
      nome_origem: 'DEPÓSITO DE UNIFORMES - SMED',
      escola_id: 2,
      codigo_destino: 'ESC-01',
      data_criacao: '2026-01-01T10:00:00Z',
      status: 'Consolidada',
      itens: [
        { produto_id: 1, codigos_erp: ['6615, 23615'], descricao: 'LEITE EM PÓ', quantidade: 10 },
      ],
    });

    const payload = lista.gerarPayload();

    expect(payload.itens[0].codigos).toEqual(['6615', '23615']);
    expect(payload.itens[0].descricao).toBe('LEITE EM PÓ');
  });
});
