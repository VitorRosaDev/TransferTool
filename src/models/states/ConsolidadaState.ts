import { IRanchoState } from './IRanchoState';
import { ItemRancho, PayloadRPA } from '../interfaces';
import { ListaRancho } from '../ListaRancho';
import { OperacaoBloqueadaError, TransicaoInvalidaError } from '../errors';
import { RascunhoState } from './RascunhoState';
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
    // Permite reabrir para Rascunho caso o operador tenha errado antes da separação física
    this.contexto.setState(new RascunhoState(this.contexto));
  }

  exportar(): PayloadRPA {
    // Validação extra por segurança, embora o Rascunho já devesse ter garantido
    if (this.contexto.data.itens.length === 0) {
      throw new OperacaoBloqueadaError('exportar', 'Consolidada (Lista Vazia)');
    }

    const payload: PayloadRPA = {
      id_transferencia_app: this.contexto.data.id || Math.floor(Math.random() * 10000), // Simulação de ID local
      data_geracao: new Date().toISOString(),
      codigo_origem: this.contexto.data.codigo_origem,
      codigo_destino: this.contexto.data.codigo_destino,
      itens: this.contexto.data.itens.map(item => ({
        codigo_item: item.codigo_item,
        quantidade: item.quantidade,
        validade: item.exige_validade && item.data_validade ? item.data_validade : null
      }))
    };

    // Transita para o estado final
    this.contexto.setState(new ExportadaState(this.contexto));
    
    return payload;
  }
}
