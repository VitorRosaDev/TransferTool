import { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface PayloadRPA {
  id_app: number;
  data_geracao: string;
  codigo_origem: string;
  codigo_destino: string;
  itens: Array<{
    codigo: string;
    quantidade: number;
    validade: string | null;
  }>;
}

export class ExportacaoModel {
  /**
   * Gera o objeto JSON formatado para o RPA a partir de uma lista consolidada.
   */
  static async gerarPayload(db: SQLiteDatabase, listaId: number): Promise<PayloadRPA> {
    // 1. Buscar Cabeçalho com Códigos (Joins)
    const cabecalho = await db.getFirstAsync<{
      id: number;
      codigo_origem: string;
      codigo_destino: string;
      data_criacao: string;
    }>(`
      SELECT 
        l.id,
        d.codigo as codigo_origem,
        e.codigo_deposito as codigo_destino,
        l.data_criacao
      FROM listas l
      JOIN depositos_origem d ON l.origem_id = d.id
      JOIN escolas e ON l.escola_id = e.id
      WHERE l.id = ?
    `, [listaId]);

    if (!cabecalho) {
      throw new Error("Lista não encontrada ou dados de origem/destino inválidos.");
    }

    // 2. Buscar Itens com Códigos
    const itens = await db.getAllAsync<{
      codigo: string;
      quantidade: number;
      data_validade: string | null;
    }>(`
      SELECT 
        i.codigo,
        il.quantidade,
        il.data_validade
      FROM itens_lista il
      JOIN itens i ON il.produto_id = i.id
      WHERE il.lista_id = ?
    `, [listaId]);

    // 3. Montar Payload
    return {
      id_app: cabecalho.id,
      data_geracao: new Date().toISOString(),
      codigo_origem: cabecalho.codigo_origem,
      codigo_destino: cabecalho.codigo_destino,
      itens: itens.map(it => ({
        codigo: it.codigo,
        quantidade: it.quantidade,
        validade: it.data_validade
      }))
    };
  }

  /**
   * Executa a exportação do arquivo JSON.
   */
  static async exportarArquivo(payload: PayloadRPA): Promise<void> {
    const fileName = `transferencia_${payload.id_app}_${payload.codigo_destino}.json`;
    const jsonString = JSON.stringify(payload, null, 2);

    if (Platform.OS === 'web') {
      this.downloadWeb(jsonString, fileName);
    } else {
      try {
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        // Escreve o conteúdo no sistema de arquivos do celular (Cache temporário)
        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
          encoding: 'utf8',
        });

        // Verifica se o compartilhamento está disponível no sistema
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: `Exportar Lista RPA - #${payload.id_app}`,
            UTI: 'public.json' // Para compatibilidade com iOS
          });
        } else {
          throw new Error("O compartilhamento não está disponível neste dispositivo.");
        }
      } catch (error) {
        console.error("Erro ao compartilhar arquivo:", error);
        throw error;
      }
    }
  }

  private static downloadWeb(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Marca a lista como exportada no banco de dados.
   */
  static async marcarComoExportada(db: SQLiteDatabase, listaId: number) {
    await db.runAsync(
      "UPDATE listas SET status = 'Exportada' WHERE id = ?",
      [listaId]
    );
  }
}
