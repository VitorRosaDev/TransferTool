import { ListaRancho } from '../models/ListaRancho';
import { RascunhoState } from '../models/states/RascunhoState';
import { ConsolidadaState } from '../models/states/ConsolidadaState';
import { ExportadaState } from '../models/states/ExportadaState';
import { OperacaoBloqueadaError, ValidacaoItemError } from '../models/errors';

describe('Padrão State: ListaRancho', () => {
  it('deve iniciar no estado Rascunho', () => {
    const lista = new ListaRancho();
    expect(lista.getState()).toBeInstanceOf(RascunhoState);
    expect(lista.getData().status).toBe('Rascunho');
  });

  it('deve permitir adicionar item no estado Rascunho', () => {
    const lista = new ListaRancho();
    lista.adicionarItem({ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: 10 });
    expect(lista.getData().itens.length).toBe(1);
    expect(lista.getData().itens[0].quantidade).toBe(10);
  });

  it('deve rejeitar quantidade não finita ao adicionar item', () => {
    const lista = new ListaRancho();

    expect(() => lista.adicionarItem({ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: Number.NaN }))
      .toThrow('A quantidade do item deve ser maior que zero');
  });

  it('deve rejeitar quantidade não finita ao alterar item', () => {
    const lista = new ListaRancho();
    lista.adicionarItem({ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: 10 });

    expect(() => lista.alterarQuantidade(1, Number.POSITIVE_INFINITY))
      .toThrow('A quantidade do item deve ser um número válido');
  });

  it('deve bloquear a consolidação se origem e destino não estiverem definidos ou sem itens', () => {
    const lista = new ListaRancho();
    expect(() => lista.consolidar()).toThrow(ValidacaoItemError);

    lista.definirOrigemDestino(1, 'DEP-01', 2, 'ESC-01');
    expect(() => lista.consolidar()).toThrow(ValidacaoItemError); // Ainda está sem itens
  });

  it('deve transitar para Consolidada quando regras forem atendidas', () => {
    const lista = new ListaRancho();
    lista.definirOrigemDestino(1, 'DEP-01', 2, 'ESC-01');
    lista.adicionarItem({ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: 10 });
    
    lista.consolidar();
    expect(lista.getState()).toBeInstanceOf(ConsolidadaState);
    expect(lista.getData().status).toBe('Consolidada');
  });

  it('deve bloquear alteração de itens no estado Consolidada', () => {
    const lista = new ListaRancho({
      id: 1,
      origem_id: 1,
      codigo_origem: 'DEP-01',
      nome_origem: 'DEP-01',
      escola_id: 1,
      codigo_destino: 'ESC-01',
      nome_destino: 'ESC-01',
      itens: [{ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: 10 }],
      status: 'Consolidada',
      data_criacao: new Date().toISOString(),
    });

    expect(() => {
      lista.adicionarItem({ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: 10 });
    }).toThrow(OperacaoBloqueadaError);
  });

  it('deve permitir reabrir a lista Consolidada', () => {
    const lista = new ListaRancho({
      id: 1,
      origem_id: 1,
      codigo_origem: 'DEP-01',
      nome_origem: 'DEP-01',
      escola_id: 1,
      codigo_destino: 'ESC-01',
      nome_destino: 'ESC-01',
      itens: [{ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: 10 }],
      status: 'Consolidada',
      data_criacao: new Date().toISOString(),
    });
    
    lista.reabrir();
    expect(lista.getState()).toBeInstanceOf(RascunhoState);
  });

  it('deve permitir reabrir a lista Exportada', () => {
    const lista = new ListaRancho({
      id: 1,
      origem_id: 1,
      codigo_origem: 'DEP-01',
      nome_origem: 'DEP-01',
      escola_id: 1,
      codigo_destino: 'ESC-01',
      nome_destino: 'ESC-01',
      itens: [{ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: 10 }],
      status: 'Exportada',
      data_criacao: new Date().toISOString(),
    });

    lista.reabrir();

    expect(lista.getState()).toBeInstanceOf(RascunhoState);
    expect(lista.getData().status).toBe('Rascunho');
  });

  it('deve gerar o Payload RPA exato ao Exportar e transitar para estado final', () => {
    const lista = new ListaRancho();
    lista.definirOrigemDestino(1, 'DEP-01', 2, 'ESC-01');
    lista.adicionarItem({ produto_id: 1, codigos_erp: ['ALIM-001'], quantidade: 10 });
    lista.consolidar();

    const payload = lista.exportar();
    
    expect(lista.getState()).toBeInstanceOf(ExportadaState);
    expect(payload.codigo_origem).toBe('DEP-01');
    expect(payload.codigo_destino).toBe('ESC-01');
  });

  it('deve converter para kg os itens fracionados ao gerar o payload', () => {
    const lista = new ListaRancho();
    lista.definirOrigemDestino(1, 'DEP-01', 2, 'ESC-01');
    lista.adicionarItem({ produto_id: 1, codigos_erp: ['9523'], descricao: 'COLORAU', quantidade: 10, fracionado: true, valor_fracionado: 0.05 });
    lista.adicionarItem({ produto_id: 2, codigos_erp: ['29285'], descricao: 'LEITE EM PÓ - SEM LACTOSE', quantidade: 2, fracionado: true, valor_fracionado: 0.4 });
    lista.adicionarItem({ produto_id: 3, codigos_erp: ['2201'], descricao: 'ARROZ PARBOILIZADO', quantidade: 10 });
    lista.consolidar();

    const payload = lista.gerarPayload();

    expect(payload.itens.find(i => i.codigos[0] === '9523')!.quantidade).toBe(0.5);
    expect(payload.itens.find(i => i.codigos[0] === '29285')!.quantidade).toBe(0.8);
    expect(payload.itens.find(i => i.codigos[0] === '2201')!.quantidade).toBe(10);
  });
});
