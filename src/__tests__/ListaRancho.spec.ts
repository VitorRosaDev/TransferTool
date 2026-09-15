import { ListaRancho } from '../models/ListaRancho';
import { RascunhoState } from '../models/states/RascunhoState';
import { ConsolidadaState } from '../models/states/ConsolidadaState';
import { ExportadaState } from '../models/states/ExportadaState';
import { OperacaoBloqueadaError, ValidacaoItemError } from '../models/errors';

describe('Padrão State: ListaRancho', () => {
  it('deve iniciar no estado Rascunho', () => {
    const lista = new ListaRancho();
    expect(lista.getState()).toBeInstanceOf(RascunhoState);
    expect(lista.data.status).toBe('Rascunho');
  });

  it('deve permitir adicionar item no estado Rascunho', () => {
    const lista = new ListaRancho();
    lista.adicionarItem({ codigo_item: 'ALIM-001', quantidade: 10 });
    expect(lista.data.itens.length).toBe(1);
    expect(lista.data.itens[0].quantidade).toBe(10);
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
    lista.adicionarItem({ codigo_item: 'ALIM-001', quantidade: 10 });
    
    lista.consolidar();
    expect(lista.getState()).toBeInstanceOf(ConsolidadaState);
    expect(lista.data.status).toBe('Consolidada');
  });

  it('deve bloquear alteração de itens no estado Consolidada', () => {
    const lista = new ListaRancho();
    lista.setState(new ConsolidadaState(lista));

    expect(() => {
      lista.adicionarItem({ codigo_item: 'ALIM-001', quantidade: 10 });
    }).toThrow(OperacaoBloqueadaError);
  });

  it('deve permitir reabrir a lista Consolidada', () => {
    const lista = new ListaRancho();
    lista.setState(new ConsolidadaState(lista));
    
    lista.reabrir();
    expect(lista.getState()).toBeInstanceOf(RascunhoState);
  });

  it('deve permitir reabrir a lista Exportada', () => {
    const lista = new ListaRancho();
    lista.setState(new ExportadaState(lista));

    lista.reabrir();

    expect(lista.getState()).toBeInstanceOf(RascunhoState);
    expect(lista.data.status).toBe('Rascunho');
  });

  it('deve gerar o Payload RPA exato ao Exportar e transitar para estado final', () => {
    const lista = new ListaRancho();
    lista.definirOrigemDestino(1, 'DEP-01', 2, 'ESC-01');
    lista.data.itens.push({ codigo_item: 'ALIM-001', quantidade: 10 });
    lista.setState(new ConsolidadaState(lista));

    const payload = lista.exportar();
    
    expect(lista.getState()).toBeInstanceOf(ExportadaState);
    expect(payload.codigo_origem).toBe('DEP-01');
    expect(payload.codigo_destino).toBe('ESC-01');
  });
});
