export function normalizeSearch(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Expande códigos que chegam agrupados por vírgula dentro de uma única string
 * (formato legado: ["6615, 23615"]) em códigos individuais ("6615", "23615").
 * Garante que o payload exportado contenha sempre um array limpo de strings.
 */
export function normalizarCodigos(codigos: string[]): string[] {
  const resultado: string[] = [];

  for (const bruto of codigos ?? []) {
    if (typeof bruto !== 'string' || bruto.trim().length === 0) continue;
    for (const parte of bruto.split(',')) {
      const limpo = parte.trim();
      if (limpo.length > 0) resultado.push(limpo);
    }
  }

  return resultado;
}