import type { ListaHist } from '../models/ListaModel';
import { encontrarListaMaisRecente, ordenarListas, reconciliarListaSelecionada } from '../models/ListaOrdenacao';

const criarLista = (id: number, status: ListaHist['status'], data_criacao: string): ListaHist => ({
  id,
  status,
  data_criacao,
  origem_codigo: `DEP-${id}`,
  destino_codigo: `ESC-${id}`,
  origem_nome: `Origem ${id}`,
  destino_nome: `Destino ${id}`,
});

describe('ListaOrdenacao', () => {
  it('encontra a carga mais recente independentemente do status visual', () => {
    const listas = [
      criarLista(1, 'Rascunho', '2026-09-15T10:00:00.000Z'),
      criarLista(2, 'Consolidada', '2026-09-15T11:00:00.000Z'),
    ];

    expect(encontrarListaMaisRecente(listas)?.id).toBe(2);
  });

  it('usa o id como desempate quando as datas são iguais', () => {
    const listas = [
      criarLista(2, 'Rascunho', '2026-09-15T10:00:00.000Z'),
      criarLista(3, 'Rascunho', '2026-09-15T10:00:00.000Z'),
    ];

    expect(encontrarListaMaisRecente(listas)?.id).toBe(3);
  });

  it('mantém a ordenação visual por status e data', () => {
    const listas = [
      criarLista(1, 'Rascunho', '2026-09-15T10:00:00.000Z'),
      criarLista(2, 'Consolidada', '2026-09-15T09:00:00.000Z'),
    ];

    expect(ordenarListas(listas).map(lista => lista.id)).toEqual([2, 1]);
  });

  it('mantém a seleção atual ou escolhe uma substituta após exclusão', () => {
    const listas = [
      criarLista(10, 'Rascunho', '2026-09-15T10:00:00.000Z'),
      criarLista(11, 'Rascunho', '2026-09-15T11:00:00.000Z'),
    ];

    expect(reconciliarListaSelecionada(listas, 11)).toBe(11);
    expect(reconciliarListaSelecionada(listas.filter(lista => lista.id !== 11), 11)).toBe(10);
    expect(reconciliarListaSelecionada([], 11)).toBeNull();
  });
});
