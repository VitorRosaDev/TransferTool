import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, Dimensions, TextInput, Modal, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ListaModel } from '../models/ListaModel';
import type { ListaHist } from '../models/ListaModel';
import { ItemModel } from '../models/ItemModel';
import type { ItemCarrinho } from '../models/ItemModel';
import { useTheme } from '../contexts/ThemeContext';
import { ListaRanchoService } from '../models/ListaRanchoService';
import { AppHeader } from '../components/AppHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + (CARD_MARGIN * 2);

const ordenarListas = (listas: ListaHist[]): ListaHist[] => {
  const possuiExportada = listas.some(lista => lista.status === 'Exportada');
  const prioridade: Record<string, number> = possuiExportada
    ? { Exportada: 0, Consolidada: 1, Rascunho: 2 }
    : { Consolidada: 0, Rascunho: 1 };

  return [...listas].sort((a, b) => {
    const diferencaStatus = (prioridade[a.status] ?? 3) - (prioridade[b.status] ?? 3);
    if (diferencaStatus !== 0) return diferencaStatus;

    const diferencaData = new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime();
    return diferencaData !== 0 ? diferencaData : a.id - b.id;
  });
};

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

export function ListasCriadas() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [listas, setListas] = useState<ListaHist[]>([]);
  const [selectedListaId, setSelectedListaId] = useState<number | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

  // Estados do Scanner Integrado
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemAtivo, setItemAtivo] = useState<any | null>(null);
  const [editandoItemId, setEditandoItemId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState('');

  const flatListRef = useRef<FlatList>(null);

  const loadListas = useCallback(async () => {
    try {
      const result = await ListaModel.getHistorico(db);
      setListas(ordenarListas(result));
    } catch (error) {
      console.error("Erro ao carregar histórico de listas:", error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadListas();
    }, [loadListas])
  );

  // Carregar itens quando a lista selecionada mudar
  useEffect(() => {
    if (selectedListaId) {
      loadItens(selectedListaId);
    } else {
      setCarrinho([]);
    }
  }, [selectedListaId]);

  // Inicializar seleção quando as listas carregarem ou mudar param
  useEffect(() => {
    if (listas.length > 0) {
      const paramId = route.params?.listaId;
      if (paramId && listas.some(lista => lista.id === paramId)) {
        setSelectedListaId(paramId);
        const index = listas.findIndex(l => l.id === paramId);
        if (index !== -1) {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: index * SNAP_INTERVAL,
              animated: true
            });
          }, 100);
        }
      } else if (selectedListaId !== null && listas.some(lista => lista.id === selectedListaId)) {
        return;
      } else {
        setSelectedListaId(listas[0].id);
      }
    } else {
      setSelectedListaId(null);
    }
  }, [listas, route.params?.listaId, selectedListaId]);

  // Busca dinâmica de itens (Scanner Logic)
  useEffect(() => {
    async function fetchItems() {
      if (searchQuery.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      try {
        const queryUnaccented = searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const result = await ItemModel.buscarCatalogo(db, searchQuery, queryUnaccented);
        setSuggestions(result);
      } catch (e) {
        console.error(e);
      }
    }
    const delay = setTimeout(fetchItems, 300);
    return () => clearTimeout(delay);
  }, [searchQuery, db]);

  const loadItens = async (id: number) => {
    setLoadingItens(true);
    try {
      const result = await ItemModel.getItensCarrinho(db, id);
      setCarrinho(result);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      setLoadingItens(false);
    }
  };

  const onScrollEnd = (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SNAP_INTERVAL);
    if (listas[index]) {
      setSelectedListaId(listas[index].id);
    }
  };

  const handleExportarTodas = async () => {
    try {
      await ListaRanchoService.exportarTodas(db);
      loadListas();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao gerar arquivo de exportação.");
    }
  };

  const handleDeletarLista = async (id: number) => {
    const deleteAction = async () => {
      try {
        await ListaRanchoService.deletar(db, id);
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

  const handleConsolidar = async (id: number) => {
    const consolidarAction = async () => {
      try {
        await ListaRanchoService.consolidar(db, id);
        loadListas();
      } catch (error) {
        console.error(error);
      }
    };

    Alert.alert("Consolidar Carga", "Deseja finalizar esta carga? Nenhuma alteração poderá ser feita depois.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", style: "default", onPress: consolidarAction }
    ]);
  };

  const handleReabrir = async (id: number) => {
    const reabrirAction = async () => {
      try {
        await ListaRanchoService.reabrir(db, id);
        loadListas();
      } catch (error) {
        console.error(error);
        Alert.alert("Erro", "Não foi possível reabrir esta lista.");
      }
    };

    Alert.alert("Reabrir Lista", "Deseja reabrir esta carga para corrigir ou incluir itens?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Reabrir", style: "default", onPress: reabrirAction }
    ]);
  };

  const handleRemoverItem = async (idItemLista: number) => {
    Alert.alert("Remover Item", "Deseja remover este item da lista?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover", style: "destructive", onPress: async () => {
          try {
            await ListaRanchoService.removerItem(db, idItemLista);
            if (selectedListaId) loadItens(selectedListaId);
          } catch (error) {
            console.error("Erro ao remover item", error);
          }
        }
      }
    ]);
  };

  const openModalAdd = (item: any) => {
    setItemAtivo(item);
    setEditandoItemId(null);
    setQuantidade('');
    setSearchQuery('');
    setSuggestions([]);
    setModalVisible(true);
  };

  const openModalEdit = (item: ItemCarrinho) => {
    setItemAtivo({
      id: item.produto_id,
      codigo: item.codigo,
      descricao: item.descricao
    });
    setEditandoItemId(item.id);
    setQuantidade(item.quantidade.toString());
    setModalVisible(true);
  };

  const handleSalvarItem = async () => {
    if (!itemAtivo || !quantidade || !selectedListaId) return;
    try {
      const qtdNum = parseFloat(quantidade);
      if (editandoItemId) {
        await ListaRanchoService.alterarQuantidade(db, editandoItemId, qtdNum);
      } else {
        await ListaRanchoService.adicionarItem(db, selectedListaId, itemAtivo.id, qtdNum);
      }
      setModalVisible(false);
      loadItens(selectedListaId);
    } catch (e) {
      console.error(e);
    }
  };

  const renderItemCarrinho = ({ item }: { item: ItemCarrinho }) => {
    const activeLista = listas.find(l => l.id === selectedListaId);
    const isEditable = activeLista?.status === 'Rascunho';

    return (
      <TouchableOpacity
        style={[styles.itemCard, { backgroundColor: colors.card }]}
        activeOpacity={isEditable ? 0.7 : 1}
        onPress={() => isEditable && openModalEdit(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.descricao}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.textMuted }]}>Código: {item.codigo}</Text>
        </View>
        <View style={[styles.qtdContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.qtdText, { color: colors.primary }]}>{item.quantidade}</Text>
        </View>
        {isEditable && (
          <TouchableOpacity style={styles.deleteItemBtn} onPress={() => handleRemoverItem(item.id)}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderListaCard = ({ item, index }: { item: ListaHist; index: number }) => {
    const isConsolidada = item.status === 'Consolidada';
    const isExportada = item.status === 'Exportada';
    const isSelected = item.id === selectedListaId;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, width: CARD_WIDTH },
          isSelected && { borderColor: colors.primary, borderWidth: 2, elevation: 4 }
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Lista #{index + 1}</Text>
          <View style={[
            styles.badge,
            isConsolidada ? styles.badgeConsolidada :
              isExportada ? styles.badgeExportada : styles.badgeRascunho
          ]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeletarLista(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={[styles.routeContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.routeText, { color: colors.textMuted }]} numberOfLines={1}>{item.origem_nome}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.textMuted} style={{ marginHorizontal: 4 }} />
          <Text style={[styles.routeText, { color: colors.textMuted }]} numberOfLines={1}>{item.destino_nome}</Text>
        </View>

        <View style={styles.cardFooterInline}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatFriendlyDate(item.data_criacao)}</Text>
        </View>
      </View>
    );
  };

  const selectedLista = listas.find(l => l.id === selectedListaId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Hub de Transferência"
        navigationMode="menu"
        onPress={() => navigation.openDrawer()}
        action={{
          accessibilityLabel: 'Exportar todas as cargas',
          icon: 'share-social-outline',
          onPress: handleExportarTodas,
        }}
      />

      {/* ESTADO VAZIO GLOBAL */}
      {listas.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={80} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.text, fontSize: 18, fontWeight: 'bold' }]}>Nenhuma carga encontrada</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Inicie uma nova lista de rancho para começar.</Text>
          <View style={{ width: '100%', paddingHorizontal: 40, marginTop: 30 }}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('NovaLista')}
            >
              <Ionicons name="add-circle-outline" size={28} color="#FFF" style={{ marginRight: 12 }} />
              <Text style={styles.buttonText}>Montar Nova Carga</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* 1. CARROSSEL (Topo - Vermelho) */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={listas}
              horizontal
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderListaCard}
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              onMomentumScrollEnd={onScrollEnd}
              contentContainerStyle={{ paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 }}
            />
          </View>

          {/* 2. PAINEL DE OPERAÇÃO (Centro - Verde) */}
          <View style={styles.itemsSection}>
            {selectedLista && (
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {selectedLista.status === 'Rascunho' ? 'Conferência e Busca' : 'Itens Consolidados'}
              </Text>
            )}

            {selectedLista?.status === 'Rascunho' && (
              <View style={styles.searchSection}>
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="barcode-outline" size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Digitar código ou nome..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                {suggestions.length > 0 && (
                  <View style={styles.suggestionList}>
                    <View style={[styles.suggestionInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {suggestions.map(s => (
                          <TouchableOpacity key={s.id} style={[styles.suggestionCard, { borderBottomColor: colors.border }]} onPress={() => openModalAdd(s)}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.sugDesc, { color: colors.text }]}>{s.descricao}</Text>
                              <Text style={[styles.sugCod, { color: colors.textMuted }]}>Cód: {s.codigo}</Text>
                            </View>
                            <Ionicons name="add-circle" size={24} color={colors.primary} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                )}
              </View>
            )}

            {loadingItens ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>Carregando...</Text>
            ) : carrinho.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aguardando itens...</Text>
              </View>
            ) : (
              <FlatList
                data={carrinho}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItemCarrinho}
                contentContainerStyle={{ paddingBottom: 150 }}
              />
            )}
          </View>

          {/* 3. BOTÃO MESTRE (Rodapé - Rosa) */}
          {selectedLista && (
            <View style={[styles.masterFooter, { paddingBottom: insets.bottom + 10, backgroundColor: colors.card }]}>
              {selectedLista.status === 'Rascunho' ? (
                <TouchableOpacity
                  style={[styles.masterBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleConsolidar(selectedLista.id)}
                >
                  <Text style={styles.masterBtnText}>Consolidar Lista</Text>
                  <Ionicons name="checkmark-done" size={24} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.masterBtn, { backgroundColor: colors.danger }]}
                  onPress={() => handleReabrir(selectedLista.id)}
                >
                  <Text style={styles.masterBtnText}>Reabrir Lista</Text>
                  <Ionicons name="create-outline" size={24} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}

      {/* 4. MODAL DE INSERÇÃO INTEGRADO */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editandoItemId ? 'Editar Item' : 'Adicionar Item'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>{itemAtivo?.descricao}</Text>
              <Text style={{ color: colors.textMuted }}>Código: {itemAtivo?.codigo}</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Quantidade *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                keyboardType="numeric"
                placeholder="Ex: 50"
                value={quantidade}
                onChangeText={setQuantidade}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.masterBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
              onPress={handleSalvarItem}
            >
              <Text style={styles.masterBtnText}>Salvar na Lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // 1. CARROSSEL
  carouselContainer: { paddingVertical: 10, height: 165 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    })
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeRascunho: { backgroundColor: '#FEF3C7' },
  badgeConsolidada: { backgroundColor: '#D1FAE5' },
  badgeExportada: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#1F2937' },
  deleteBtn: { padding: 4 },
  routeContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginTop: 8 },
  routeText: { fontSize: 12, fontWeight: '600', flex: 1 },
  cardFooterInline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  dateText: { fontSize: 10 },

  // 2. PAINEL DE OPERAÇÃO
  itemsSection: { flex: 1, paddingHorizontal: 20, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  searchSection: { marginBottom: 15, zIndex: 100 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 50, paddingHorizontal: 15 },
  input: { flex: 1, fontSize: 16 },

  suggestionList: { position: 'absolute', top: 55, left: 0, right: 0, zIndex: 200 },
  suggestionInner: { borderRadius: 12, borderWidth: 1, maxHeight: 200, elevation: 5, overflow: 'hidden' },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  sugDesc: { fontSize: 14, fontWeight: '600' },
  sugCod: { fontSize: 12 },

  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10, elevation: 1 },
  itemTitle: { fontSize: 15, fontWeight: 'bold' },
  itemSubtitle: { fontSize: 13, marginTop: 2 },
  qtdContainer: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginHorizontal: 10 },
  qtdText: { fontSize: 16, fontWeight: 'bold' },
  deleteItemBtn: { padding: 6 },

  // 3. BOTÃO MESTRE
  masterFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopColor: '#eee',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -5 }
  },
  masterBtn: { flexDirection: 'row', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 12 },
  masterBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { marginTop: 12, fontSize: 14, textAlign: 'center' },

  // BOTÃO PREMIUM REPLICADO DA HOME
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // MODAL
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { borderWidth: 1, borderRadius: 12, height: 50, paddingHorizontal: 16, fontSize: 18 },
});
