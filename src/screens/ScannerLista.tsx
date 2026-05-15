import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ListaModel, ListaDetalhes } from '../models/ListaModel';
import { ItemModel, ProdutoCatalogo, ItemCarrinho } from '../models/ItemModel';

// Utilitário para máscara de data DD/MM/YYYY
const formatDate = (text: string) => {
  const cleaned = text.replace(/\D/g, '');
  let formatted = cleaned;
  if (cleaned.length > 2) {
    formatted = cleaned.replace(/^(\d{2})(\d)/, '$1/$2');
  }
  if (cleaned.length > 4) {
    formatted = formatted.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
  }
  return formatted.substring(0, 10);
};

// Validar se data (DD/MM/YYYY) já passou
const isDateExpired = (dateStr: string) => {
  if (dateStr.length !== 10) return false;
  const [day, month, year] = dateStr.split('/');
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
};

export function ScannerLista() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const db = useSQLiteContext();
  const { listaId } = route.params as { listaId: number };

  const [listaDetalhes, setListaDetalhes] = useState<ListaDetalhes | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProdutoCatalogo[]>([]);
  
  // Estado do Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [itemAtivo, setItemAtivo] = useState<ProdutoCatalogo | null>(null);
  const [editandoItemId, setEditandoItemId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [validade, setValidade] = useState('');

  // 1. Carregar Dados Iniciais
  const loadDetalhesLista = useCallback(async () => {
    try {
      const detalhes = await ListaModel.getDetalhes(db, listaId);
      setListaDetalhes(detalhes);
    } catch (e) {
      console.error("Erro ao buscar detalhes da lista", e);
    }
  }, [db, listaId]);

  const loadCarrinho = useCallback(async () => {
    try {
      const itens = await ItemModel.getItensCarrinho(db, listaId);
      setCarrinho(itens);
    } catch (e) {
      console.error("Erro ao carregar carrinho", e);
    }
  }, [db, listaId]);

  useEffect(() => {
    loadDetalhesLista();
    loadCarrinho();
  }, [loadDetalhesLista, loadCarrinho]);

  // 2. Busca Dinâmica de Itens
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
        console.error("Erro na busca de itens:", e);
      }
    }
    const delay = setTimeout(fetchItems, 300);
    return () => clearTimeout(delay);
  }, [searchQuery, db]);

  // 3. Abrir Modal para Inserção/Edição
  const openModal = (item: ProdutoCatalogo) => {
    setItemAtivo(item);
    setEditandoItemId(null);
    setQuantidade('');
    setValidade('');
    setSearchQuery('');
    setSuggestions([]);
    setModalVisible(true);
  };

  const openModalEdit = (item: ItemCarrinho) => {
    setItemAtivo({
      id: item.produto_id,
      codigo: item.codigo,
      descricao: item.descricao,
      exige_validade: item.exige_validade
    });
    setEditandoItemId(item.id);
    setQuantidade(item.quantidade.toString());
    setValidade(item.data_validade || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setItemAtivo(null);
    setEditandoItemId(null);
  };

  // 4. Salvar Item no Carrinho
  const handleAdicionarItem = async () => {
    if (!itemAtivo || !quantidade) return;
    
    // Validação de Preenchimento
    if (itemAtivo.exige_validade === 1 && validade.length !== 10) {
      Alert.alert("Atenção", "Preencha a data de validade no formato DD/MM/AAAA completo.");
      return;
    }

    try {
      const qtdNum = parseFloat(quantidade);
      const validadeFinal = validade || null;

      if (editandoItemId) {
        await ItemModel.atualizar(db, editandoItemId, qtdNum, validadeFinal);
      } else {
        await ItemModel.adicionar(db, listaId, itemAtivo.id, qtdNum, validadeFinal);
      }
      closeModal();
      loadCarrinho();
    } catch (e) {
      console.error("Erro ao salvar item:", e);
      Alert.alert("Erro", "Não foi possível salvar o item.");
    }
  };

  const handleRemoverItem = async (idItemLista: number) => {
    const deleteAction = async () => {
      try {
        await ItemModel.remover(db, idItemLista);
        loadCarrinho();
      } catch (error) {
        console.error("Erro ao remover item", error);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Deseja remover este item da lista?")) {
        deleteAction();
      }
    } else {
      Alert.alert("Remover Item", "Deseja remover este item da lista?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: deleteAction }
      ]);
    }
  };

  // 5. Consolidar Lista
  const handleConsolidar = async () => {
    if (carrinho.length === 0) {
      if (Platform.OS === 'web') {
        window.alert("Adicione pelo menos um item antes de consolidar.");
      } else {
        Alert.alert("Lista Vazia", "Adicione pelo menos um item antes de consolidar.");
      }
      return;
    }

    const consolidarAction = async () => {
      try {
        await ListaModel.consolidar(db, listaId);
        navigation.goBack();
      } catch (error) {
        console.error(error);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm("Deseja finalizar esta carga? Nenhuma alteração poderá ser feita depois.");
      if (confirm) {
        consolidarAction();
      }
    } else {
      Alert.alert("Consolidar Carga", "Deseja finalizar esta carga? Nenhuma alteração poderá ser feita depois.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", style: "default", onPress: consolidarAction }
      ]);
    }
  };

  const isConsolidada = listaDetalhes?.status === 'Consolidada';

  // Renders
  const renderItemCarrinho = ({ item }: { item: ItemCarrinho }) => (
    <TouchableOpacity 
      style={styles.carrinhoCard} 
      activeOpacity={isConsolidada ? 1 : 0.7} 
      onPress={() => !isConsolidada && openModalEdit(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.descricao}</Text>
        <Text style={styles.itemSubtitle}>Código: {item.codigo}</Text>
        {item.data_validade && (
          <Text style={styles.itemSubtitle}>Validade: <Text style={{fontWeight:'bold'}}>{item.data_validade}</Text></Text>
        )}
      </View>
      <View style={styles.qtdContainer}>
        <Text style={styles.qtdText}>{item.quantidade}</Text>
      </View>
      {!isConsolidada && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemoverItem(item.id)}>
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lista #{listaId}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{listaDetalhes?.status}</Text></View>
        </View>
        <View style={styles.routeContainer}>
          <Text style={styles.routeText}>{listaDetalhes?.origem_nome}</Text>
          <Ionicons name="arrow-forward" size={16} color="#93C5FD" style={{ marginHorizontal: 8 }} />
          <Text style={styles.routeText}>{listaDetalhes?.destino_nome}</Text>
        </View>
      </View>

      {/* BARRA DE PESQUISA */}
      {!isConsolidada && (
        <View style={styles.searchSection}>
          <View style={styles.inputContainer}>
            <Ionicons name="barcode-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Digite o código ou nome do item..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionList}>
              {suggestions.map(s => (
                <TouchableOpacity key={s.id} style={styles.suggestionCard} onPress={() => openModal(s)}>
                  <View>
                    <Text style={styles.sugDesc}>{s.descricao}</Text>
                    <Text style={styles.sugCod}>Cód: {s.codigo}</Text>
                  </View>
                  <Ionicons name="add-circle" size={28} color="#2563EB" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* CARRINHO */}
      <View style={[styles.carrinhoSection, isConsolidada && { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Itens Adicionados ({carrinho.length})</Text>
        {carrinho.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Nenhum item na lista.</Text>
          </View>
        ) : (
          <FlatList
            data={carrinho}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItemCarrinho}
            contentContainerStyle={{ paddingBottom: isConsolidada ? 20 : 100 }}
          />
        )}
      </View>

      {/* FOOTER BUTTON */}
      {!isConsolidada && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.consolidarBtn} onPress={handleConsolidar}>
            <Text style={styles.consolidarText}>Consolidar Carga</Text>
            <Ionicons name="checkmark-done" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL DE INSERÇÃO */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editandoItemId ? 'Editar Item' : 'Adicionar Item'}</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={28} color="#6B7280" /></TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalItemName}>{itemAtivo?.descricao}</Text>
              <Text style={styles.modalItemCode}>Código: {itemAtivo?.codigo}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantidade *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  placeholder="Ex: 50"
                  value={quantidade}
                  onChangeText={setQuantidade}
                  autoFocus
                />
              </View>

              {itemAtivo?.exige_validade === 1 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Data de Validade (DD/MM/AAAA) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={validade}
                    onChangeText={(t) => setValidade(formatDate(t))}
                  />
                  {validade.length === 10 && isDateExpired(validade) && (
                    <Text style={styles.warningText}>
                      <Ionicons name="warning" size={14} /> Atenção: Este produto consta como VENCIDO.
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity 
                style={[styles.addBtn, (!quantidade || (itemAtivo?.exige_validade === 1 && validade.length !== 10)) && styles.disabledBtn]}
                onPress={handleAdicionarItem}
                disabled={!quantidade || (itemAtivo?.exige_validade === 1 && validade.length !== 10)}
              >
                <Text style={styles.addBtnText}>Salvar Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#2563EB', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', flex: 1 },
  badge: { backgroundColor: '#1E40AF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  routeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: '#1D4ED8', padding: 12, borderRadius: 8 },
  routeText: { color: '#EFF6FF', fontSize: 14, fontWeight: '600', flex: 1 },
  
  searchSection: { padding: 20, zIndex: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', height: 56, paddingHorizontal: 16 },
  searchIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  suggestionList: { position: 'absolute', top: 80, left: 20, right: 20, backgroundColor: '#FFF', borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, maxHeight: 200, zIndex: 20 },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sugDesc: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  sugCod: { fontSize: 14, color: '#6B7280' },

  carrinhoSection: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 16, color: '#9CA3AF', fontSize: 16 },
  
  carrinhoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  itemSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  qtdContainer: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginHorizontal: 12 },
  qtdText: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  deleteBtn: { padding: 8 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  consolidarBtn: { backgroundColor: '#10B981', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  consolidarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginRight: 12 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalBody: { flex: 1 },
  modalItemName: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  modalItemCode: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  modalInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, height: 56, paddingHorizontal: 16, fontSize: 18, color: '#1F2937' },
  warningText: { color: '#EF4444', fontSize: 12, marginTop: 8, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#2563EB', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
  disabledBtn: { backgroundColor: '#9CA3AF' },
  addBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
