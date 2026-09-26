import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, Dimensions, TextInput, Modal, NativeScrollEvent, NativeSyntheticEvent, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ListaModel } from '../models/ListaModel';
import type { ListaHist } from '../models/ListaModel';
import { ItemModel } from '../models/ItemModel';
import type { ItemCarrinho, ProdutoCatalogo } from '../models/ItemModel';
import { useTheme } from '../contexts/ThemeContext';
import { ListaRanchoService } from '../models/ListaRanchoService';
import { ValidacaoItemError } from '../models/errors';
import { AppHeader } from '../components/AppHeader';
import { ListaCard } from '../components/ListaCard';
import { NovaCargaCard } from '../components/NovaCargaCard';
import { encontrarListaMaisRecente, ordenarListas, reconciliarListaSelecionada } from '../models/ListaOrdenacao';
import { normalizeSearch } from '../utils/stringUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + (CARD_MARGIN * 2);

/** Formata a lista JSON de códigos ERP em uma string legível ("2201, 37357"). */
function formatarCodigos(codigosErp: string): string {
  try {
    return JSON.parse(codigosErp).join(', ');
  } catch {
    return codigosErp;
  }
}

export function ListasCriadas() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [listas, setListas] = useState<ListaHist[]>([]);
  const [selectedListaId, setSelectedListaId] = useState<number | null>(null);
  const [expandedListaId, setExpandedListaId] = useState<number | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [idListaCarregando, setIdListaCarregando] = useState<number | null>(null);

  // Estados do Scanner Integrado
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProdutoCatalogo[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemAtivo, setItemAtivo] = useState<ProdutoCatalogo | null>(null);
  const [editandoItemId, setEditandoItemId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const idListaParaFocarRef = useRef<number | null>(null);
  const idCarregamentoItensRef = useRef<number | null>(null);
  const versaoCarregamentoListasRef = useRef(0);
  const idListaSelecionadaRef = useRef<number | null>(null);
  const searchVersionRef = useRef(0);

  useEffect(() => {
    idListaSelecionadaRef.current = selectedListaId;
  }, [selectedListaId]);

  const carregarListas = useCallback(async (focarUltima: boolean) => {
    const versaoCarregamento = ++versaoCarregamentoListasRef.current;
    try {
      const result = await ListaModel.getHistorico(db);
      const listasOrdenadas = ordenarListas(result);
      if (versaoCarregamento !== versaoCarregamentoListasRef.current) return;

      if (focarUltima) {
        idListaParaFocarRef.current = encontrarListaMaisRecente(listasOrdenadas)?.id ?? null;
      } else {
        const idReconciliado = reconciliarListaSelecionada(listasOrdenadas, idListaSelecionadaRef.current);
        if (idReconciliado !== idListaSelecionadaRef.current) {
          idListaParaFocarRef.current = idReconciliado;
        }
      }
      setListas(listasOrdenadas);
    } catch (error) {
      console.error("Erro ao carregar histórico de listas:", error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      carregarListas(true);
    }, [carregarListas])
  );

  // Carregar itens quando a lista selecionada mudar
  useEffect(() => {
    setSearchQuery('');
    setSuggestions([]);
    setIsSearchFocused(false);

    if (selectedListaId) {
      loadItens(selectedListaId);
    } else {
      idCarregamentoItensRef.current = null;
      setCarrinho([]);
      setLoadingItens(false);
      setIdListaCarregando(null);
    }
  }, [selectedListaId]);

  useEffect(() => {
    if (listas.length === 0) {
      setSelectedListaId(null);
      return;
    }

    const idListaParaFocar = idListaParaFocarRef.current;
    if (idListaParaFocar === null) return;

    const indiceLista = listas.findIndex(lista => lista.id === idListaParaFocar);
    if (indiceLista === -1) return;

    setSelectedListaId(idListaParaFocar);
    idListaParaFocarRef.current = null;
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({ index: indiceLista, animated: false });
    });
  }, [listas]);

  // Busca dinâmica de itens (Scanner Logic) — com pre-load ao focar
  useEffect(() => {
    async function fetchItems() {
      const currentVersion = ++searchVersionRef.current;

      if (!isSearchFocused && searchQuery.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      try {
        const queryUnaccented = normalizeSearch(searchQuery);
        const result = await ItemModel.buscarCatalogo(db, searchQuery, queryUnaccented);
        if (currentVersion === searchVersionRef.current) {
          setSuggestions(result);
        }
      } catch (e) {
        console.error(e);
      }
    }
    const delay = setTimeout(fetchItems, 300);
    return () => clearTimeout(delay);
  }, [searchQuery, isSearchFocused, db]);

  const loadItens = async (id: number) => {
    idCarregamentoItensRef.current = id;
    setIdListaCarregando(id);
    setLoadingItens(true);
    try {
      const result = await ItemModel.getItensCarrinho(db, id);
      if (idCarregamentoItensRef.current === id) {
        setCarrinho(result);
      }
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      if (idCarregamentoItensRef.current === id) {
        setLoadingItens(false);
        setIdListaCarregando(null);
      }
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SNAP_INTERVAL);
    if (listas[index]) {
      setSelectedListaId(listas[index].id);
      setExpandedListaId(null);
    }
  };

  const toggleListaDetalhes = (listaId: number) => {
    setSelectedListaId(listaId);
    setExpandedListaId(currentId => currentId === listaId ? null : listaId);
  };

  const handleExportarTodas = async () => {
    try {
      await ListaRanchoService.exportarTodas(db);
      carregarListas(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao gerar arquivo de exportação.");
    }
  };

  const handleDeletarLista = async (id: number) => {
    const deleteAction = async () => {
      try {
        await ListaRanchoService.deletar(db, id);
        carregarListas(false);
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
        carregarListas(false);
      } catch (error) {
        console.error(error);
        Alert.alert("Erro ao Consolidar", error instanceof ValidacaoItemError ? error.message : "Não foi possível consolidar esta lista.");
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
        carregarListas(false);
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

  const openModalAdd = (item: ProdutoCatalogo) => {
    setItemAtivo(item);
    setEditandoItemId(null);
    setQuantidade('');
    setSearchQuery('');
    setSuggestions([]);
    setIsSearchFocused(false);
    setModalVisible(true);
  };

  const openModalEdit = (item: ItemCarrinho) => {
    setItemAtivo({
      id: item.produto_id,
      codigos_erp: item.codigos_erp,
      descricao: item.descricao
    });
    setEditandoItemId(item.id);
    setQuantidade(item.quantidade.toString());
    setModalVisible(true);
  };

  const handleSalvarItem = async () => {
    if (!itemAtivo || !quantidade || !selectedListaId) return;
    try {
      const qtdNum = Number(quantidade.trim());
      if (isNaN(qtdNum) || qtdNum <= 0) {
        Alert.alert('Quantidade inválida', 'Informe uma quantidade maior que zero.');
        return;
      }
      if (editandoItemId) {
        await ListaRanchoService.alterarQuantidade(db, editandoItemId, qtdNum);
      } else {
        await ListaRanchoService.adicionarItem(db, selectedListaId, itemAtivo.id, qtdNum);
      }
      setModalVisible(false);
      loadItens(selectedListaId);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar o item.');
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
          <Text style={[styles.itemSubtitle, { color: colors.textMuted }]}>Código(s): {formatarCodigos(item.codigos_erp)}</Text>
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
          <View style={[styles.carouselContainer, expandedListaId !== null && styles.carouselContainerExpanded]}>
            <FlatList
              ref={flatListRef}
              data={listas}
              horizontal
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <ListaCard
                  item={item}
                  index={index}
                  cardWidth={CARD_WIDTH}
                  isSelected={item.id === selectedListaId}
                  isExpanded={item.id === expandedListaId}
                  estaCarregando={item.id === idListaCarregando}
                  onToggleDetails={() => toggleListaDetalhes(item.id)}
                  onDelete={() => handleDeletarLista(item.id)}
                />
              )}
              ListFooterComponent={
                <NovaCargaCard
                  cardWidth={CARD_WIDTH}
                  onPress={() => navigation.navigate('NovaLista')}
                />
              }
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              onMomentumScrollEnd={onScrollEnd}
              getItemLayout={(_, index) => ({
                length: SNAP_INTERVAL,
                offset: SNAP_INTERVAL * index,
                index,
              })}
              onScrollToIndexFailed={({ index }) => {
                flatListRef.current?.scrollToOffset({
                  offset: SNAP_INTERVAL * index,
                  animated: false,
                });
              }}
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
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  />
                </View>
                {suggestions.length > 0 && (
                  <View style={[styles.suggestionList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <FlatList
                      data={suggestions}
                      keyExtractor={(item) => item.id.toString()}
                      keyboardShouldPersistTaps="handled"
                      style={{ maxHeight: 200 }}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={[styles.suggestionCard, { borderBottomColor: colors.border }]} onPress={() => openModalAdd(item)}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.sugDesc, { color: colors.text }]}>{item.descricao}</Text>
                            <Text style={[styles.sugCod, { color: colors.textMuted }]}>Cód(s): {formatarCodigos(item.codigos_erp)}</Text>
                          </View>
                          <Ionicons name="add-circle" size={24} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    />
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editandoItemId ? 'Editar Item' : 'Adicionar Item'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>{itemAtivo?.descricao}</Text>
              <Text style={{ color: colors.textMuted }}>Código(s): {formatarCodigos(itemAtivo?.codigos_erp || '[]')}</Text>
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // 1. CARROSSEL
  carouselContainer: { paddingVertical: 10, height: 165 },
  carouselContainerExpanded: { height: 280 },

  // 2. PAINEL DE OPERAÇÃO
  itemsSection: { flex: 1, paddingHorizontal: 20, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  searchSection: { marginBottom: 15, zIndex: 100 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 50, paddingHorizontal: 15 },
  input: { flex: 1, fontSize: 16 },

  suggestionList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      }
    })
  },
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
