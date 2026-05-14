import { IRanchoState } from './IRanchoState';
import { ItemRancho, PayloadRPA } from '../interfaces';
import { ListaRancho } from '../ListaRancho';
import { OperacaoBloqueadaError, TransicaoInvalidaError, ValidacaoItemError } from '../errors';
import { ConsolidadaState } from './ConsolidadaState'; // Será implementada

export class RascunhoState implements IRanchoState {
  constructor(private contexto: ListaRancho) {}

  getNomeEstado(): "Rascunho" {
    return 'Rascunho';
  }

  adicionarItem(item: ItemRancho): void {
    if (item.quantidade <= 0) {
      throw new ValidacaoItemError("A quantidade do item deve ser maior que zero.");
    }
    
    // Regra de Negócio: Se o item exige validade, não pode entrar sem ela.
    if (item.exige_validade && !item.data_validade) {
      throw new ValidacaoItemError(`O item ${item.codigo_item} exige data de validade.`);
    }

    const index = this.contexto.data.itens.findIndex(i => i.codigo_item === item.codigo_item);
    if (index >= 0) {
      // Se já existe, soma a quantidade (assumindo mesma validade no contexto de simplificação)
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
    // Validações antes de transitar
    if (!this.contexto.data.codigo_origem || !this.contexto.data.codigo_destino) {
      throw new ValidacaoItemError("Origem e Destino devem estar preenchidos para consolidar.");
    }
    if (this.contexto.data.itens.length === 0) {
      throw new ValidacaoItemError("A lista deve ter pelo menos um item para ser consolidada.");
    }

    this.contexto.setState(new ConsolidadaState(this.contexto));
  }

  reabrir(): void {
    // Já está em Rascunho
    return; 
  }

  exportar(): PayloadRPA {
    throw new TransicaoInvalidaError('Rascunho', 'Exportada');
  }
}
