import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ListaModel, Suggestion } from '../models/ListaModel';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export function NovaLista() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();

  // Estados do Wizard
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  // Seleções
  const [origem, setOrigem] = useState<Suggestion | null>(null);
  const [destino, setDestino] = useState<Suggestion | null>(null);

  const { colors } = useTheme();

  // Efeito de Busca em Tempo Real
  useEffect(() => {
    async function fetchSuggestions() {
      if (searchQuery.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      
      try {
        const queryUnaccented = searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        if (step === 1) {
          const result = await ListaModel.buscarOrigens(db, searchQuery, queryUnaccented);
          setSuggestions(result);
        } else {
          const result = await ListaModel.buscarDestinos(db, searchQuery, queryUnaccented);
          setSuggestions(result);
        }
      } catch (e) {
        console.error("Erro ao buscar sugestões:", e);
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, step]);

  const handleSelect = (item: Suggestion) => {
    if (step === 1) {
      setOrigem(item);
      setSearchQuery('');
      setSuggestions([]);
    } else {
      setDestino(item);
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  const handleNext = () => {
    if (step === 1 && origem) setStep(2);
  };

  const handleConfirm = async () => {
    if (!origem || !destino) return;

    try {
      const novaListaId = await ListaModel.criarRascunho(db, origem.id, destino.id);
      setStep(1);
      setOrigem(null);
      setDestino(null);
      setSearchQuery('');
      navigation.navigate('ListasCriadas', { listaId: novaListaId });
    } catch (e) {
      console.error("Erro ao iniciar lista:", e);
      Alert.alert("Erro", "Não foi possível criar a lista de rancho no banco de dados.");
    }
  };

  const isNextDisabled = step === 1 ? !origem : !destino;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Passo {step} de 2</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 1 ? 'Selecione a Origem' : 'Selecione o Destino'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {step === 1 ? 'De onde os itens estão saindo?' : 'Para onde os itens vão?'}
        </Text>

        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Digite para pesquisar..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>

        {suggestions.length > 0 && (
          <View style={[styles.suggestionList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {suggestions.map(s => (
              <TouchableOpacity key={s.id} style={[styles.suggestionItem, { borderBottomColor: colors.border }]} onPress={() => handleSelect(s)}>
                <Text style={[styles.suggestionText, { color: colors.text }]}>{s.nome}</Text>
                <Text style={[styles.suggestionCode, { color: colors.textMuted }]}>
                  Código: {step === 1 ? s.codigo : s.codigo_deposito}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.selectionArea}>
          {origem && (
            <View style={[styles.selectedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.selectedLabel, { color: colors.textMuted }]}>Origem Selecionada</Text>
              <Text style={[styles.selectedValue, { color: colors.text }]}>{origem.nome}</Text>
            </View>
          )}
          {destino && (
            <View style={[styles.selectedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.selectedLabel, { color: colors.textMuted }]}>Destino Selecionado</Text>
              <Text style={[styles.selectedValue, { color: colors.text }]}>{destino.nome}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.btnContinue, isNextDisabled ? styles.btnDisabled : { backgroundColor: colors.primary }]}
          disabled={isNextDisabled}
          onPress={step === 1 ? handleNext : handleConfirm}
        >
          <Text style={styles.btnContinueText}>
            {step === 1 ? 'Continuar para Destino' : 'Continuar e Iniciar Lista'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
  
  content: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  
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
    maxHeight: 250,
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
  suggestionCode: { fontSize: 14, marginTop: 4 },
  
  selectionArea: { flex: 1, marginTop: 24 },
  selectedCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  selectedLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  selectedValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4, flexShrink: 1 },
  
  footer: { padding: 24, borderTopWidth: 1 },
  btnContinue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnContinueText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
