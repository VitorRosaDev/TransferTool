import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ListaModel, ListaHist } from '../models/ListaModel';
import { useTheme } from '../contexts/ThemeContext';
import { ExportacaoModel } from '../models/ExportacaoModel';



// Utilitário para Data Amigável
const formatFriendlyDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
};

// Calcula os dias restantes para auto-exclusão (limite de 7 dias)
const getDaysToExpiration = (isoString: string) => {
  if (!isoString) return 0;
  const createdDate = new Date(isoString);
  const expirationDate = new Date(createdDate);
  expirationDate.setDate(expirationDate.getDate() + 7);
  
  const today = new Date();
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

export function ListasCriadas() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const [listas, setListas] = useState<ListaHist[]>([]);
  const { colors } = useTheme();

  const loadListas = useCallback(async () => {
    try {
      const result = await ListaModel.getHistorico(db);
      setListas(result);
    } catch (error) {
      console.error("Erro ao carregar histórico de listas:", error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadListas();
    }, [loadListas])
  );

  const handleExportar = async (id: number) => {
    try {
      const payload = await ExportacaoModel.gerarPayload(db, id);
      await ExportacaoModel.exportarArquivo(payload);
      await ExportacaoModel.marcarComoExportada(db, id);
      loadListas();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao gerar arquivo de exportação.");
    }
  };

  const handleDeletarLista = async (id: number) => {
    const deleteAction = async () => {
      try {
        await ListaModel.deletar(db, id);
        loadListas();
      } catch (error) {
        console.error("Erro ao deletar lista:", error);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm(`Atenção: A Lista #${id} e todos os seus itens serão apagados para sempre. Confirma?`);
      if (confirm) deleteAction();
    } else {
      Alert.alert(
        "Excluir Lista", 
        `Atenção: A Lista #${id} e todos os seus itens serão apagados para sempre. Confirma?`, 
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Excluir Definitivamente", style: "destructive", onPress: deleteAction }
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: ListaHist }) => {
    const isConsolidada = item.status === 'Consolidada';
    const isExportada = item.status === 'Exportada';
    const diasRestantes = getDaysToExpiration(item.data_criacao);

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card }]} 
        activeOpacity={0.7} 
        onPress={() => navigation.navigate('ScannerLista', { listaId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Lista #{item.id}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[
              styles.badge, 
              isConsolidada ? styles.badgeConsolidada : 
              isExportada ? styles.badgeExportada : styles.badgeRascunho
            ]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={(e) => { e.stopPropagation(); handleDeletarLista(item.id); }}
            >
              <Ionicons name="trash-outline" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.routeContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.routeText, { color: colors.textMuted }]} numberOfLines={1}>{item.origem_nome}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} style={{ marginHorizontal: 8 }} />
          <Text style={[styles.routeText, { color: colors.textMuted }]} numberOfLines={1}>{item.destino_nome}</Text>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          {(isConsolidada || isExportada) ? (
            <TouchableOpacity 
              style={[styles.exportBtn, { backgroundColor: colors.primary }]}
              onPress={(e) => { e.stopPropagation(); handleExportar(item.id); }}
            >
              <Text style={styles.exportBtnText}>Gerar JSON</Text>
              <Ionicons name="download-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.footerInfo}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatFriendlyDate(item.data_criacao)}</Text>
            </View>
          )}
          <Text style={[styles.expirationText, { color: colors.textMuted }, diasRestantes <= 2 && { color: colors.danger }]}>
            {diasRestantes}d restantes
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listas Criadas</Text>
      </View>

      {listas.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma lista encontrada.</Text>
        </View>
      ) : (
        <FlatList
          data={listas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  menuBtn: { marginRight: 16 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  
  listContainer: { padding: 16 },
  card: { 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.08)',
      }
    })
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  badgeRascunho: { backgroundColor: '#FEF3C7' },
  badgeConsolidada: { backgroundColor: '#D1FAE5' },
  badgeExportada: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#1F2937' },
  deleteBtn: { padding: 4 },

  exportBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    gap: 6
  },
  exportBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  routeContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 12 },
  routeText: { fontSize: 14, fontWeight: '600', flex: 1 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12 },
  footerInfo: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12 },
  expirationText: { fontSize: 11, fontStyle: 'italic' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 16, fontSize: 16 },
});
