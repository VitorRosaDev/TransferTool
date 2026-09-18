export interface ItemRancho {
  id?: number;
  produto_id: number;
  codigos_erp: string[];
  descricao?: string;
  quantidade: number;
}

export type StatusLista = 'Rascunho' | 'Consolidada' | 'Exportada';

export interface IListaRanchoData {
  id?: number;
  origem_id: number;
  codigo_origem: string;
  escola_id: number;
  codigo_destino: string;
  itens: ItemRancho[];
  status: StatusLista;
  data_criacao: string;
}

export interface PayloadRPA {
  id_app: number;
  data_geracao: string;
  codigo_origem: string;
  codigo_destino: string;
  itens: Array<{
    codigos: string[];
    quantidade: number;
  }>;
}
