import type { ListaHist } from './ListaModel';

const prioridadePorStatus: Record<string, number> = {
  Exportada: 0,
  Consolidada: 1,
  Rascunho: 2,
};

export function ordenarListas(listas: ListaHist[]): ListaHist[] {
  const possuiExportada = listas.some(lista => lista.status === 'Exportada');
  const prioridade = possuiExportada
    ? prioridadePorStatus
    : { Consolidada: 0, Rascunho: 1 };

  return [...listas].sort((a, b) => {
    const diferencaStatus = (prioridade[a.status] ?? 3) - (prioridade[b.status] ?? 3);
    if (diferencaStatus !== 0) return diferencaStatus;

    const diferencaData = new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime();
    return diferencaData !== 0 ? diferencaData : a.id - b.id;
  });
}

export function encontrarListaMaisRecente(listas: ListaHist[]): ListaHist | undefined {
  return listas.reduce<ListaHist | undefined>((maisRecente, lista) => {
    if (!maisRecente) return lista;

    const dataLista = new Date(lista.data_criacao).getTime();
    const dataMaisRecente = new Date(maisRecente.data_criacao).getTime();
    return dataLista > dataMaisRecente || (dataLista === dataMaisRecente && lista.id > maisRecente.id)
      ? lista
      : maisRecente;
  }, undefined);
}

export function reconciliarListaSelecionada(listas: ListaHist[], idAtual: number | null): number | null {
  if (listas.length === 0) return null;
  if (idAtual !== null && listas.some(lista => lista.id === idAtual)) return idAtual;
  return listas[0].id;
}
