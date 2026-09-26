import { IRanchoState } from './IRanchoState';
import type { ItemRancho, PayloadRPA } from '../interfaces';
import type { ListaRancho } from '../ListaRancho';
import { OperacaoBloqueadaError, TransicaoInvalidaError } from '../errors';
import { normalizarCodigos } from '../../utils/stringUtils';
import { quantidadeErpDoItem } from '../fracionamento';

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
      descricao_origem: this.contexto.getData().nome_origem,
      codigo_destino: this.contexto.getData().codigo_destino,
      descricao_destino: this.contexto.getData().nome_destino,
      itens: this.contexto.getData().itens.map(item => ({
        codigos: normalizarCodigos(item.codigos_erp),
        descricao: item.descricao ?? '',
        quantidade: quantidadeErpDoItem(item)
      }))
    };
  }

  exportar(): PayloadRPA {
    throw new TransicaoInvalidaError('Exportada', 'Exportada');
  }
}
