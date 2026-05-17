import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ListaModel, Suggestion } from '../models/ListaModel';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export function NovaLista() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);

  // Seleções de Origem e Destino
  const [origem, setOrigem] = useState<Suggestion | null>(null);
  const [destino, setDestino] = useState<Suggestion | null>(null);

  // Estados de busca individuais
  const [searchQueryOrigem, setSearchQueryOrigem] = useState('');
  const [searchQueryDestino, setSearchQueryDestino] = useState('');

  // Estados de sugestões individuais
  const [suggestionsOrigem, setSuggestionsOrigem] = useState<Suggestion[]>([]);
  const [suggestionsDestino, setSuggestionsDestino] = useState<Suggestion[]>([]);

  // Estados de foco para pré-visualização ao tocar
  const [isFocusedOrigem, setIsFocusedOrigem] = useState(false);
  const [isFocusedDestino, setIsFocusedDestino] = useState(false);

  // Busca Reativa de Origens (com preview instantâneo ao focar)
  useEffect(() => {
    async function fetchOrigemSuggestions() {
      if (!isFocusedOrigem && searchQueryOrigem.trim().length === 0) {
        setSuggestionsOrigem([]);
        return;
      }
      try {
        const queryUnaccented = searchQueryOrigem.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const result = await ListaModel.buscarOrigens(db, searchQueryOrigem, queryUnaccented);
        setSuggestionsOrigem(result);
      } catch (e) {
        console.error("Erro ao buscar origens:", e);
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchOrigemSuggestions();
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQueryOrigem, isFocusedOrigem]);

  // Busca Reativa de Destinos (com preview instantâneo ao focar)
  useEffect(() => {
    async function fetchDestinoSuggestions() {
      if (!isFocusedDestino && searchQueryDestino.trim().length === 0) {
        setSuggestionsDestino([]);
        return;
      }
      try {
        const queryUnaccented = searchQueryDestino.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const result = await ListaModel.buscarDestinos(db, searchQueryDestino, queryUnaccented);
        setSuggestionsDestino(result);
      } catch (e) {
        console.error("Erro ao buscar destinos:", e);
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchDestinoSuggestions();
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQueryDestino, isFocusedDestino]);

  // Handlers de Seleção
  const handleSelectOrigem = (item: Suggestion) => {
    setOrigem(item);
    setSearchQueryOrigem('');
    setSuggestionsOrigem([]);
    setIsFocusedOrigem(false);
  };

  const handleSelectDestino = (item: Suggestion) => {
    setDestino(item);
    setSearchQueryDestino('');
    setSuggestionsDestino([]);
    setIsFocusedDestino(false);
  };

  // Handlers de Exclusão/Limpeza para erros de entrada
  const handleClearOrigem = () => {
    setOrigem(null);
    setSearchQueryOrigem('');
    setSuggestionsOrigem([]);
    // Quando limpa a origem, por lógica de cascata limpamos o destino também
    setDestino(null);
    setSearchQueryDestino('');
    setSuggestionsDestino([]);
  };

  const handleClearDestino = () => {
    setDestino(null);
    setSearchQueryDestino('');
    setSuggestionsDestino([]);
  };

  const handleFocusDestino = () => {
    setIsFocusedDestino(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  // Confirmação final e gravação de rascunho
  const handleConfirm = async () => {
    if (!origem || !destino) return;

    try {
      const novaListaId = await ListaModel.criarRascunho(db, origem.id, destino.id);
      setOrigem(null);
      setDestino(null);
      setSearchQueryOrigem('');
      setSearchQueryDestino('');
      navigation.navigate('ListasCriadas', { listaId: novaListaId });
    } catch (e) {
      console.error("Erro ao iniciar lista:", e);
      Alert.alert("Erro", "Não foi possível criar a lista de rancho no banco de dados.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Cabeçalho Fixo Unificado */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Montar Nova Carga</Text>
      </View>

      {/* Conteúdo com Acordeon */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>Origem e Destino</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Defina os depósitos da carga local offline
        </Text>

        {/* ==================== SEÇÃO 1: ORIGEM ==================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Origem da Carga</Text>
          
          {origem === null ? (
            <View>
              {/* Campo de Busca */}
              <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: isFocusedOrigem ? colors.primary : colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Buscar depósito de origem..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQueryOrigem}
                  onChangeText={setSearchQueryOrigem}
                  onFocus={() => setIsFocusedOrigem(true)}
                  onBlur={() => setTimeout(() => setIsFocusedOrigem(false), 200)}
                />
                {searchQueryOrigem.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQueryOrigem('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Preview Rolável de Sugestões de Origem */}
              {(isFocusedOrigem || searchQueryOrigem.length > 0) && suggestionsOrigem.length > 0 && (
                <View style={[styles.suggestionList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {suggestionsOrigem.map(s => (
                      <TouchableOpacity 
                        key={s.id} 
                        style={[styles.suggestionItem, { borderBottomColor: colors.border }]} 
                        onPress={() => handleSelectOrigem(s)}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text }]}>{s.nome}</Text>
                        <Text style={[styles.suggestionCode, { color: colors.textMuted }]}>
                          Código: {s.codigo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            /* Card Consolidado com Opção de Exclusão */
            <View style={[styles.selectedCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <View style={styles.selectedCardLeft}>
                <Ionicons name="business" size={24} color={colors.primary} />
                <View style={styles.selectedCardText}>
                  <Text style={[styles.selectedValue, { color: colors.text }]}>{origem.nome}</Text>
                  <Text style={[styles.selectedLabel, { color: colors.textMuted }]}>Código: {origem.codigo}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClearOrigem} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ==================== SEÇÃO 2: DESTINO (ACORDEON) ==================== */}
        {origem !== null && (
          <View style={[styles.sectionContainer, { marginTop: 28 }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Destino da Carga</Text>
            
            {destino === null ? (
              <View>
                {/* Campo de Busca */}
                <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: isFocusedDestino ? colors.primary : colors.border }]}>
                  <Ionicons name="search" size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Buscar escola de destino..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQueryDestino}
                    onChangeText={setSearchQueryDestino}
                    onFocus={handleFocusDestino}
                    onBlur={() => setTimeout(() => setIsFocusedDestino(false), 200)}
                  />
                  {searchQueryDestino.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQueryDestino('')}>
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Preview Rolável de Sugestões de Destino */}
                {(isFocusedDestino || searchQueryDestino.length > 0) && suggestionsDestino.length > 0 && (
                  <View style={[styles.suggestionList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {suggestionsDestino.map(s => (
                        <TouchableOpacity 
                          key={s.id} 
                          style={[styles.suggestionItem, { borderBottomColor: colors.border }]} 
                          onPress={() => handleSelectDestino(s)}
                        >
                          <Text style={[styles.suggestionText, { color: colors.text }]}>{s.nome}</Text>
                          <Text style={[styles.suggestionCode, { color: colors.textMuted }]}>
                            Código: {s.codigo_deposito}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              /* Card Consolidado com Opção de Exclusão */
              <View style={[styles.selectedCard, { backgroundColor: colors.card, borderColor: '#10B981' }]}>
                <View style={styles.selectedCardLeft}>
                  <Ionicons name="school" size={24} color="#10B981" />
                  <View style={styles.selectedCardText}>
                    <Text style={[styles.selectedValue, { color: colors.text }]}>{destino.nome}</Text>
                    <Text style={[styles.selectedLabel, { color: colors.textMuted }]}>Código: {destino.codigo_deposito}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClearDestino} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Rodapé Integrado de Confirmação */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.btnContinue, (!origem || !destino) ? styles.btnDisabled : { backgroundColor: colors.primary }]}
          disabled={!origem || !destino}
          onPress={handleConfirm}
        >
          <Text style={styles.btnContinueText}>Iniciar Carga</Text>
          <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
  
  content: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  
  sectionContainer: {
    width: '100%',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  
  suggestionList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
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
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  suggestionText: { fontSize: 16, fontWeight: '500', flexShrink: 1 },
  suggestionCode: { fontSize: 13, marginTop: 4 },
  
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  selectedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  selectedCardText: {
    flex: 1,
  },
  selectedLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  selectedValue: { fontSize: 16, fontWeight: 'bold', flexShrink: 1 },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  
  footer: { padding: 24, borderTopWidth: 1 },
  btnContinue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  btnDisabled: { backgroundColor: '#374151', opacity: 0.5 },
  btnContinueText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
