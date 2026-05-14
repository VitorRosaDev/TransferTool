export interface ItemRancho {
  id?: number;
  codigo_item: string;
  descricao?: string; // Usado apenas na UI, nunca exportado
  quantidade: number;
  data_validade?: string; // Opcional depedendo do item
  exige_validade: boolean;
}

export interface IListaRanchoData {
  id?: number;
  origem_id: number;
  codigo_origem: string;
  escola_id: number;
  codigo_destino: string;
  itens: ItemRancho[];
  status: 'Rascunho' | 'Consolidada' | 'Exportada';
  data_criacao: string;
}

// Representação estrita do Payload para o RPA
export interface PayloadRPA {
  id_transferencia_app: number;
  data_geracao: string;
  codigo_origem: string;
  codigo_destino: string;
  itens: Array<{
    codigo_item: string;
    quantidade: number;
    validade: string | null;
  }>;
}
