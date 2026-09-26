import type { ItemRancho } from './interfaces';

/**
 * Converte a quantidade contada pelo operador para a quantidade que deve ser
 * preenchida no ERP. Para itens fracionados (registrados por kg, mas distribuídos
 * em pacotes no depósito), o valor final é `pacotes × valor_fracionado (kg/un.)`.
 *
 * O arredondamento para 3 casas decimais elimina ruído de ponto flutuante
 * (ex.: 3 × 0.05 = 0.15000000000000002 → 0.15), mantendo o payload limpo.
 */
export function quantidadeErpDoItem(item: ItemRancho): number {
  if (!item.fracionado) return item.quantidade;
  const fator = item.valor_fracionado ?? 1;
  return Math.round(item.quantidade * fator * 1000) / 1000;
}
