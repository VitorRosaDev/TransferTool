import { IRanchoState } from './IRanchoState';
import type { ItemRancho, PayloadRPA } from '../interfaces';
import type { ListaRancho } from '../ListaRancho';
import { TransicaoInvalidaError, ValidacaoItemError } from '../errors';

export class RascunhoState implements IRanchoState {
  constructor(private contexto: ListaRancho) {}

  getNomeEstado(): "Rascunho" {
    return 'Rascunho';
  }

  adicionarItem(item: ItemRancho): void {
    if (item.quantidade <= 0) {
      throw new ValidacaoItemError("A quantidade do item deve ser maior que zero.");
    }
    
    const index = this.contexto.data.itens.findIndex(i => i.codigo_item === item.codigo_item);
    if (index >= 0) {
      this.contexto.data.itens[index].quantidade += item.quantidade;
    } else {
      this.contexto.data.itens.push(item);
    }
  }

  removerItem(codigoItem: string): void {
    this.contexto.data.itens = this.contexto.data.itens.filter(i => i.codigo_item !== codigoItem);
  }

  alterarQuantidade(codigoItem: string, quantidade: number): void {
    if (quantidade <= 0) {
      this.removerItem(codigoItem);
      return;
    }
    const item = this.contexto.data.itens.find(i => i.codigo_item === codigoItem);
    if (item) {
      item.quantidade = quantidade;
    } else {
      throw new ValidacaoItemError("Item não encontrado na lista.");
    }
  }

  definirOrigemDestino(origemId: number, codigoOrigem: string, escolaId: number, codigoDestino: string): void {
    this.contexto.data.origem_id = origemId;
    this.contexto.data.codigo_origem = codigoOrigem;
    this.contexto.data.escola_id = escolaId;
    this.contexto.data.codigo_destino = codigoDestino;
  }

  consolidar(): void {
    if (!this.contexto.data.codigo_origem || !this.contexto.data.codigo_destino) {
      throw new ValidacaoItemError("Origem e Destino devem estar preenchidos para consolidar.");
    }
    if (this.contexto.data.itens.length === 0) {
      throw new ValidacaoItemError("A lista deve ter pelo menos um item para ser consolidada.");
    }

    this.contexto.transicionarParaConsolidada();
  }

  reabrir(): void {
    return; 
  }

  gerarPayload(): PayloadRPA {
    throw new TransicaoInvalidaError('Rascunho', 'Exportada');
  }

  exportar(): PayloadRPA {
    throw new TransicaoInvalidaError('Rascunho', 'Exportada');
  }
}
