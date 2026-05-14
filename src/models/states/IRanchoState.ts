import { ItemRancho, PayloadRPA } from '../interfaces';

/**
 * Interface base para os Estados do Rancho.
 * Define todas as operações possíveis que mudam de comportamento 
 * dependendo de onde o Rancho está no ciclo de vida.
 */
export interface IRanchoState {
  getNomeEstado(): 'Rascunho' | 'Consolidada' | 'Exportada';
  
  adicionarItem(item: ItemRancho): void;
  removerItem(codigoItem: string): void;
  alterarQuantidade(codigoItem: string, quantidade: number): void;
  definirOrigemDestino(origemId: number, codigoOrigem: string, escolaId: number, codigoDestino: string): void;
  
  consolidar(): void;
  reabrir(): void;
  exportar(): PayloadRPA;
}
