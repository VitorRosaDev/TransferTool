import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { PayloadRPA } from './interfaces';

export type { PayloadRPA } from './interfaces';

export class ExportacaoModel {
  /**
   * Executa a exportação do arquivo JSON.
   */
  static async exportarArquivo(payload: PayloadRPA | PayloadRPA[], depositoNome?: string): Promise<void> {
    const payloads = Array.isArray(payload) ? payload : [payload];
    const fileName = this.montarNomeArquivo(depositoNome);
    const jsonString = JSON.stringify(payloads, null, 2);

    if (Platform.OS === 'web') {
      this.downloadWeb(jsonString, fileName);
    } else {
      try {
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
          encoding: 'utf8',
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Exportar cargas para RPA',
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

  /** Monta o nome do arquivo no formato Carga_<deposito>_<DD-MM-YYYY>_<HHhsMMmin>.json */
  private static montarNomeArquivo(depositoNome?: string): string {
    const agora = new Date();
    const dd = String(agora.getDate()).padStart(2, '0');
    const mm = String(agora.getMonth() + 1).padStart(2, '0');
    const yyyy = agora.getFullYear();
    const hh = String(agora.getHours()).padStart(2, '0');
    const min = String(agora.getMinutes()).padStart(2, '0');

    const deposito = this.sanitizarNomeArquivo(depositoNome);
    const data = `${dd}-${mm}-${yyyy}`;
    const hora = `${hh}h${min}min`;

    const prefixo = deposito ? `Carga_${deposito}_${data}_${hora}` : `Carga_${data}_${hora}`;
    return `${prefixo}.json`;
  }

  /** Remove caracteres inválidos para nome de arquivo, preservando acentos e espaços. */
  private static sanitizarNomeArquivo(nome?: string): string {
    if (!nome) return '';
    return nome
      .trim()
      .replace(/[\\/:*?"<>|\r\n]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim();
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

}
