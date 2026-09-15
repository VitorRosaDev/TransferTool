import type { IRanchoState } from './states/IRanchoState';
import type { ItemRancho, IListaRanchoData, PayloadRPA } from './interfaces';
import { RascunhoState } from './states/RascunhoState';
import { ConsolidadaState } from './states/ConsolidadaState';
import { ExportadaState } from './states/ExportadaState';

export class ListaRancho {
  private state: IRanchoState;
  private data: IListaRanchoData;

  constructor(initialData?: IListaRanchoData) {
    if (initialData) {
      this.data = { ...initialData };
      this.state = this.restoreState(initialData.status);
    } else {
      this.data = {
        origem_id: 0,
        codigo_origem: '',
        escola_id: 0,
        codigo_destino: '',
        itens: [],
        status: 'Rascunho',
        data_criacao: new Date().toISOString()
      };
      this.state = new RascunhoState(this);
    }
  }

  public adicionarItem(item: ItemRancho): void {
    this.state.adicionarItem(item);
  }

  public removerItem(codigoItem: string): void {
    this.state.removerItem(codigoItem);
  }

  public alterarQuantidade(codigoItem: string, quantidade: number): void {
    this.state.alterarQuantidade(codigoItem, quantidade);
  }

  public definirOrigemDestino(origemId: number, codigoOrigem: string, escolaId: number, codigoDestino: string): void {
    this.state.definirOrigemDestino(origemId, codigoOrigem, escolaId, codigoDestino);
  }

  public consolidar(): void {
    this.state.consolidar();
  }

  public reabrir(): void {
    this.state.reabrir();
  }

  public gerarPayload(): PayloadRPA {
    return this.state.gerarPayload();
  }

  public exportar(): PayloadRPA {
    return this.state.exportar();
  }

  public setState(newState: IRanchoState): void {
    this.state = newState;
    this.data.status = newState.getNomeEstado();
  }

  public getState(): IRanchoState {
    return this.state;
  }

  public transicionarParaConsolidada(): void {
    this.setState(new ConsolidadaState(this));
  }

  public transicionarParaRascunho(): void {
    this.setState(new RascunhoState(this));
  }

  private restoreState(statusString: string): IRanchoState {
    switch (statusString) {
      case 'Rascunho': return new RascunhoState(this);
      case 'Consolidada': return new ConsolidadaState(this);
      case 'Exportada': return new ExportadaState(this);
      default: return new RascunhoState(this);
    }
  }
}
