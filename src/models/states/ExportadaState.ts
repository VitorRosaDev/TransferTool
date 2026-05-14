import { IRanchoState } from './IRanchoState';
import { ItemRancho, PayloadRPA } from '../interfaces';
import { ListaRancho } from '../ListaRancho';
import { OperacaoBloqueadaError, TransicaoInvalidaError } from '../errors';

export class ExportadaState implements IRanchoState {
  constructor(private contexto: ListaRancho) {}

  getNomeEstado(): "Exportada" {
    return 'Exportada';
  }

  adicionarItem(item: ItemRancho): void {
    throw new OperacaoBloqueadaError('adicionarItem', 'Exportada');
  }

  removerItem(codigoItem: string): void {
    throw new OperacaoBloqueadaError('removerItem', 'Exportada');
  }

  alterarQuantidade(codigoItem: string, quantidade: number): void {
    throw new OperacaoBloqueadaError('alterarQuantidade', 'Exportada');
  }

  definirOrigemDestino(origemId: number, codigoOrigem: string, escolaId: number, codigoDestino: string): void {
    throw new OperacaoBloqueadaError('definirOrigemDestino', 'Exportada');
  }

  consolidar(): void {
    throw new TransicaoInvalidaError('Exportada', 'Consolidada');
  }

  reabrir(): void {
    throw new TransicaoInvalidaError('Exportada', 'Rascunho');
  }

  exportar(): PayloadRPA {
    throw new TransicaoInvalidaError('Exportada', 'Exportada');
  }
}
