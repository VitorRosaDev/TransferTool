import { IRanchoState } from './IRanchoState';
import type { ItemRancho, PayloadRPA } from '../interfaces';
import type { ListaRancho } from '../ListaRancho';
import { OperacaoBloqueadaError, TransicaoInvalidaError } from '../errors';

export class ExportadaState implements IRanchoState {
  constructor(private contexto: ListaRancho) {}

  getNomeEstado(): "Exportada" {
    return 'Exportada';
  }

  adicionarItem(item: ItemRancho): void {
    throw new OperacaoBloqueadaError('adicionarItem', 'Exportada');
  }

  removerItem(produtoId: number): void {
    throw new OperacaoBloqueadaError('removerItem', 'Exportada');
  }

  alterarQuantidade(produtoId: number, quantidade: number): void {
    throw new OperacaoBloqueadaError('alterarQuantidade', 'Exportada');
  }

  definirOrigemDestino(origemId: number, codigoOrigem: string, escolaId: number, codigoDestino: string): void {
    throw new OperacaoBloqueadaError('definirOrigemDestino', 'Exportada');
  }

  consolidar(): void {
    throw new TransicaoInvalidaError('Exportada', 'Consolidada');
  }

  reabrir(): void {
    this.contexto.transicionarParaRascunho();
  }

  gerarPayload(): PayloadRPA {
    return {
      id_app: this.contexto.getData().id || 0,
      data_geracao: new Date().toISOString(),
      codigo_origem: this.contexto.getData().codigo_origem,
      codigo_destino: this.contexto.getData().codigo_destino,
      itens: this.contexto.getData().itens.map(item => ({
        codigos: item.codigos_erp,
        quantidade: item.quantidade
      }))
    };
  }

  exportar(): PayloadRPA {
    throw new TransicaoInvalidaError('Exportada', 'Exportada');
  }
}
