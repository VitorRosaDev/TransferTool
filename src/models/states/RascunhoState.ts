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
    if (!Number.isFinite(item.quantidade) || item.quantidade <= 0) {
      throw new ValidacaoItemError("A quantidade do item deve ser maior que zero.");
    }
    
    const index = this.contexto.getData().itens.findIndex(i => i.produto_id === item.produto_id);
    if (index >= 0) {
      this.contexto.getData().itens[index].quantidade += item.quantidade;
    } else {
      this.contexto.getData().itens.push(item);
    }
  }

  removerItem(produtoId: number): void {
    this.contexto.getData().itens = this.contexto.getData().itens.filter(i => i.produto_id !== produtoId);
  }

  alterarQuantidade(produtoId: number, quantidade: number): void {
    if (!Number.isFinite(quantidade)) {
      throw new ValidacaoItemError("A quantidade do item deve ser um número válido.");
    }
    if (quantidade <= 0) {
      this.removerItem(produtoId);
      return;
    }
    const item = this.contexto.getData().itens.find(i => i.produto_id === produtoId);
    if (item) {
      item.quantidade = quantidade;
    } else {
      throw new ValidacaoItemError("Item não encontrado na lista.");
    }
  }

  definirOrigemDestino(origemId: number, codigoOrigem: string, escolaId: number, codigoDestino: string): void {
    this.contexto.getData().origem_id = origemId;
    this.contexto.getData().codigo_origem = codigoOrigem;
    this.contexto.getData().escola_id = escolaId;
    this.contexto.getData().codigo_destino = codigoDestino;
  }

  consolidar(): void {
    if (!this.contexto.getData().codigo_origem || !this.contexto.getData().codigo_destino) {
      throw new ValidacaoItemError("Origem e Destino devem estar preenchidos para consolidar.");
    }
    if (this.contexto.getData().itens.length === 0) {
      throw new ValidacaoItemError("A lista deve ter pelo menos um item para ser consolidada.");
    }

    this.contexto.transicionarParaConsolidada();
  }

  reabrir(): void {
    throw new TransicaoInvalidaError('Rascunho', 'Rascunho');
  }

  gerarPayload(): PayloadRPA {
    throw new TransicaoInvalidaError('Rascunho', 'Exportada');
  }

  exportar(): PayloadRPA {
    throw new TransicaoInvalidaError('Rascunho', 'Exportada');
  }
}
