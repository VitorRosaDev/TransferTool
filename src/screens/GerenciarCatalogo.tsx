import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../contexts/ThemeContext';
import { CatalogoModel, ItemCatalogo } from '../models/CatalogoModel';

type ActionType = 'adicionar' | 'remover' | 'reativar';
type CategoryType = 'deposito' | 'escola' | 'item';

export function GerenciarCatalogo() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [step, setStep] = useState(1);
  const [action, setAction] = useState<ActionType | null>(null);
  const [category, setCategory] = useState<CategoryType | null>(null);

  const [batchSearchQuery, setBatchSearchQuery] = useState('');

  const reset = () => {
    setStep(1);
    setAction(null);
    setCategory(null);
    setBatchSearchQuery('');
  };

  const toggleAction = (selectedAction: ActionType) => {
    setAction(prev => prev === selectedAction ? null : selectedAction);
  };

  const renderCategories = () => (
    <View style={[styles.subcategoryContainer, { borderTopColor: colors.border }]}>
      <TouchableOpacity 
        style={[styles.subcategoryButton, { borderBottomColor: colors.border }]}
        onPress={() => { setCategory('deposito'); setStep(2); }}
      >
        <View style={styles.subcategoryLeft}>
          <Ionicons name="business-outline" size={20} color={colors.text} />
          <Text style={[styles.subcategoryText, { color: colors.text }]}>Depósitos (Origens de carga)</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.subcategoryButton, { borderBottomColor: colors.border }]}
        onPress={() => { setCategory('escola'); setStep(2); }}
      >
        <View style={styles.subcategoryLeft}>
          <Ionicons name="school-outline" size={20} color={colors.text} />
          <Text style={[styles.subcategoryText, { color: colors.text }]}>Escolas (Destinos de carga)</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.subcategoryButton, { borderBottomWidth: 0 }]}
        onPress={() => { setCategory('item'); setStep(2); }}
      >
        <View style={styles.subcategoryLeft}>
          <Ionicons name="cube-outline" size={20} color={colors.text} />
          <Text style={[styles.subcategoryText, { color: colors.text }]}>Itens / Produtos (Catálogo)</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>O que deseja fazer?</Text>
      
      {/* CARD 1: ADICIONAR */}
      <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.menuCardHeader}
          onPress={() => toggleAction('adicionar')}
        >
          <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Adicionar Novo</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Inserir depósito, escola ou item</Text>
          </View>
          <Ionicons 
            name={action === 'adicionar' ? "chevron-down" : "chevron-forward"} 
            size={20} 
            color={colors.textMuted} 
          />
        </TouchableOpacity>

        {action === 'adicionar' && renderCategories()}
      </View>

      {/* CARD 2: REMOVER */}
      <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.menuCardHeader}
          onPress={() => toggleAction('remover')}
        >
          <Ionicons name="trash-outline" size={32} color="#EF4444" />
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Remover (Desativar)</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Ocultar depósito, escola ou item</Text>
          </View>
          <Ionicons 
            name={action === 'remover' ? "chevron-down" : "chevron-forward"} 
            size={20} 
            color={colors.textMuted} 
          />
        </TouchableOpacity>

        {action === 'remover' && renderCategories()}
      </View>

      {/* CARD 3: REATIVAR */}
      <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.menuCardHeader}
          onPress={() => toggleAction('reativar')}
        >
          <Ionicons name="refresh-circle-outline" size={32} color="#10B981" />
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Reativar</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Reativar depósito, escola ou item</Text>
          </View>
          <Ionicons 
            name={action === 'reativar' ? "chevron-down" : "chevron-forward"} 
            size={20} 
            color={colors.textMuted} 
          />
        </TouchableOpacity>

        {action === 'reativar' && renderCategories()}
      </View>
    </View>
  );

  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!codigo.trim() || !nome.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await CatalogoModel.adicionar(db, category!, codigo.trim(), nome.trim());
      Alert.alert('Sucesso', `${category} adicionado com sucesso!`);
      setCodigo('');
      setNome('');
      setStep(1);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível adicionar. Verifique se o código já existe.');
    } finally {
      setLoading(false);
    }
  };

  const renderAddForm = () => (
    <View style={styles.form}>
      <Text style={[styles.label, { color: colors.text }]}>Código Único</Text>
      <TextInput 
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Ex: DEP-01, ALIM-99..."
        placeholderTextColor={colors.textMuted}
        value={codigo}
        onChangeText={setCodigo}
        autoCapitalize="characters"
      />

      <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Nome / Descrição</Text>
      <TextInput 
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Descrição completa para busca..."
        placeholderTextColor={colors.textMuted}
        value={nome}
        onChangeText={setNome}
      />

      <TouchableOpacity 
        style={[styles.submitButton, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>{loading ? 'Salvando...' : 'Confirmar Adição'}</Text>
      </TouchableOpacity>
    </View>
  );

  const [items, setItems] = useState<ItemCatalogo[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchItems = async () => {
    if (!category || action === 'adicionar') return;
    setLoading(true);
    try {
      const data = await CatalogoModel.listar(db, category, action === 'remover');
      setItems(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os itens.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (step === 2 && action !== 'adicionar') {
      fetchItems();
      setSelectedIds([]);
      setBatchSearchQuery('');
    }
  }, [step]);

  const filteredItems = React.useMemo(() => {
    if (!batchSearchQuery.trim()) {
      return items;
    }
    const queryNormalized = batchSearchQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return items.filter(item => {
      const nomeNormalized = (item.nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const codigoNormalized = (item.codigo || '').toLowerCase();
      
      return nomeNormalized.includes(queryNormalized) || codigoNormalized.includes(queryNormalized);
    });
  }, [items, batchSearchQuery]);

  const handleSelectAll = () => {
    const visibleIds = filteredItems.map(item => item.id);
    setSelectedIds(prev => {
      const newSelection = [...prev];
      visibleIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const handleClearSelection = () => {
    const visibleIds = filteredItems.map(item => item.id);
    setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchAction = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Aviso', 'Selecione ao menos um item.');
      return;
    }

    const novoStatus = action === 'reativar' ? 1 : 0;
    const confirmMsg = action === 'remover' 
      ? `Deseja remover ${selectedIds.length} item(ns)? Eles não aparecerão em novas listas.` 
      : `Deseja reativar ${selectedIds.length} item(ns)?`;

    const executeAction = async () => {
      setLoading(true);
      try {
        await CatalogoModel.alterarStatusLote(db, category!, selectedIds, novoStatus);
        Alert.alert('Sucesso', 'Operação realizada com sucesso!');
        setStep(1);
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Ocorreu um erro ao processar o lote.');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMsg);
      if (confirmed) executeAction();
    } else {
      Alert.alert(
        "Confirmar Ação",
        confirmMsg,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar", onPress: executeAction }
        ]
      );
    }
  };

  const renderBatchFlow = () => {
    const visibleItems = filteredItems;

    return (
      <View style={{ flex: 1 }}>
        <View>
          <Text style={[styles.subtitle, { color: colors.textMuted, marginBottom: 16 }]}>
            Selecione os itens para {action === 'remover' ? 'desativar' : 'reativar'}:
          </Text>

          {/* Campo de Busca */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar por nome ou código..."
              placeholderTextColor={colors.textMuted}
              value={batchSearchQuery}
              onChangeText={setBatchSearchQuery}
              autoCapitalize="none"
            />
            {batchSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setBatchSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Botões de Ação em Lote */}
          {items.length > 0 && (
            <View style={styles.batchActionsRow}>
              <TouchableOpacity 
                style={[styles.batchHelperButton, { borderColor: colors.primary }]} 
                onPress={handleSelectAll}
              >
                <Ionicons name="checkmark-done" size={16} color={colors.primary} />
                <Text style={[styles.batchHelperButtonText, { color: colors.primary }]}>Selecionar Todos</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.batchHelperButton, { borderColor: '#EF4444' }]} 
                onPress={handleClearSelection}
              >
                <Ionicons name="close" size={16} color="#EF4444" />
                <Text style={[styles.batchHelperButtonText, { color: '#EF4444' }]}>Limpar Seleção</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Resumo da Seleção e Itens Encontrados */}
          {items.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: colors.textMuted }]}>
                Selecionados: <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{selectedIds.length}</Text>
              </Text>
              <Text style={[styles.summaryText, { color: colors.textMuted }]}>
                Exibindo: <Text style={{ color: colors.text, fontWeight: 'bold' }}>{visibleItems.length}</Text> de {items.length}
              </Text>
            </View>
          )}
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {visibleItems.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>Nenhum item encontrado.</Text>
            </View>
          )}

          {visibleItems.map(item => (
            <TouchableOpacity 
              key={item.id}
              style={[styles.listItem, { backgroundColor: colors.card, borderColor: selectedIds.includes(item.id) ? colors.primary : 'transparent' }]}
              onPress={() => toggleSelect(item.id)}
            >
              <Ionicons 
                name={selectedIds.includes(item.id) ? "checkbox" : "square-outline"} 
                size={24} 
                color={selectedIds.includes(item.id) ? colors.primary : colors.textMuted} 
              />
              <View style={styles.listItemText}>
                <Text style={[styles.itemNome, { color: colors.text }]}>{item.nome}</Text>
                <Text style={[styles.itemCodigo, { color: colors.textMuted }]}>{item.codigo}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.batchFooterStatic}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: action === 'remover' ? '#EF4444' : '#10B981', opacity: loading || selectedIds.length === 0 ? 0.6 : 1, marginTop: 0 }]}
            onPress={handleBatchAction}
            disabled={loading || selectedIds.length === 0}
          >
            <Text style={styles.submitButtonText}>
              {action === 'remover' 
                ? `Remover Selecionados (${selectedIds.length})` 
                : `Reativar Selecionados (${selectedIds.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep2 = () => (
    <View style={[styles.content, { flex: 1 }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {action === 'adicionar' ? 'Novo' : action === 'remover' ? 'Remover' : 'Reativar'} {category === 'item' ? 'Item' : category === 'deposito' ? 'Depósito' : 'Escola'}
        </Text>
      </View>
      
      {action === 'adicionar' ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {renderAddForm()}
        </ScrollView>
      ) : (
        renderBatchFlow()
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {step === 1 ? (
        <ScrollView style={styles.container}>
          {renderStep1()}
        </ScrollView>
      ) : (
        renderStep2()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      }
    }),
  },
  menuTextContainer: { flex: 1, marginLeft: 16 },
  menuTitle: { fontSize: 18, fontWeight: 'bold' },
  menuDesc: { fontSize: 14, marginTop: 2 },
  placeholder: {
    padding: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  resetButton: {
    marginTop: 40,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center'
  },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  submitButton: {
    marginTop: 32,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  batchContainer: { marginTop: 10 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  listItemText: { marginLeft: 16, flex: 1 },
  itemNome: { fontSize: 16, fontWeight: 'bold', flexShrink: 1 },
  itemCodigo: { fontSize: 14, marginTop: 2 },
  emptyContainer: { 
    padding: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    height: '100%',
  },
  batchActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  batchHelperButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 10,
    gap: 6,
  },
  batchHelperButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  summaryText: {
    fontSize: 13,
  },
  menuCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      }
    }),
  },
  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  subcategoryContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  subcategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  subcategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subcategoryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  batchFooterStatic: {
    paddingVertical: 12,
  }
});
