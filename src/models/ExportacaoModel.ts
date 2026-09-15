import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { PayloadRPA } from './interfaces';

export type { PayloadRPA } from './interfaces';

export class ExportacaoModel {
  /**
   * Executa a exportação do arquivo JSON.
   */
  static async exportarArquivo(payload: PayloadRPA | PayloadRPA[]): Promise<void> {
    const payloads = Array.isArray(payload) ? payload : [payload];
    const fileName = `transferencias_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
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
