import { IRanchoState } from './IRanchoState';
import type { ItemRancho, PayloadRPA } from '../interfaces';
import type { ListaRancho } from '../ListaRancho';
import { OperacaoBloqueadaError, TransicaoInvalidaError } from '../errors';
import { ExportadaState } from './ExportadaState';

export class ConsolidadaState implements IRanchoState {
  constructor(private contexto: ListaRancho) {}

  getNomeEstado(): "Consolidada" {
    return 'Consolidada';
  }

  adicionarItem(item: ItemRancho): void {
    throw new OperacaoBloqueadaError('adicionarItem', 'Consolidada');
  }

  removerItem(codigoItem: string): void {
    throw new OperacaoBloqueadaError('removerItem', 'Consolidada');
  }

  alterarQuantidade(codigoItem: string, quantidade: number): void {
    throw new OperacaoBloqueadaError('alterarQuantidade', 'Consolidada');
  }

  definirOrigemDestino(origemId: number, codigoOrigem: string, escolaId: number, codigoDestino: string): void {
    throw new OperacaoBloqueadaError('definirOrigemDestino', 'Consolidada');
  }

  consolidar(): void {
    throw new TransicaoInvalidaError('Consolidada', 'Consolidada');
  }

  reabrir(): void {
    this.contexto.transicionarParaRascunho();
  }

  gerarPayload(): PayloadRPA {
    if (this.contexto.getData().itens.length === 0) {
      throw new OperacaoBloqueadaError('exportar', 'Consolidada (Lista Vazia)');
    }

    const payload: PayloadRPA = {
      id_app: this.contexto.getData().id || Math.floor(Math.random() * 10000),
      data_geracao: new Date().toISOString(),
      codigo_origem: this.contexto.getData().codigo_origem,
      codigo_destino: this.contexto.getData().codigo_destino,
      itens: this.contexto.getData().itens.map(item => ({
        codigo: item.codigo_item,
        quantidade: item.quantidade
      }))
    };

    return payload;
  }

  exportar(): PayloadRPA {
    const payload = this.gerarPayload();
    this.contexto.transicionarParaExportada();
    return payload;
  }
}
