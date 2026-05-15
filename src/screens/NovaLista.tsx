import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ListaModel, Suggestion } from '../models/ListaModel';

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

    // Debounce simples
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

  const handleContinuar = () => {
    if (step === 1 && origem) {
      setStep(2);
    }
  };

  const handleVoltar = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };

  const handleIniciarSeparacao = async () => {
    if (!origem || !destino) return;

    try {
      // Cria a lista em rascunho usando o Model
      const novaListaId = await ListaModel.criarRascunho(db, origem.id, destino.id);

      // 3. Limpar formulário e Navegar
      setStep(1);
      setOrigem(null);
      setDestino(null);
      setSearchQuery('');
      
      navigation.navigate('ScannerLista', { listaId: novaListaId });

    } catch (e) {
      console.error("Erro ao iniciar lista:", e);
      Alert.alert("Erro", "Não foi possível criar a lista de rancho no banco de dados.");
    }
  };

  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity style={styles.suggestionCard} onPress={() => handleSelect(item)}>
      <View style={styles.suggestionIcon}>
        <Ionicons name={step === 1 ? "business-outline" : "school-outline"} size={24} color="#4B5563" />
      </View>
      <View>
        <Text style={styles.suggestionTitle}>{item.nome}</Text>
        <Text style={styles.suggestionSubtitle}>Cód: {item.codigo || item.codigo_deposito}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header Wizard */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passo {step} de 2</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 1 ? 'Selecione a Origem' : 'Selecione o Destino'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1 
            ? 'De onde os itens estão saindo?' 
            : 'Para qual escola/unidade vão os itens?'}
        </Text>

        {/* Selecionado Atual */}
        {(step === 1 ? origem : destino) ? (
          <View style={styles.selectedContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.selectedLabel}>
                {step === 1 ? 'Origem Escolhida:' : 'Destino Escolhido:'}
              </Text>
              <Text style={styles.selectedText}>{(step === 1 ? origem : destino)?.nome}</Text>
            </View>
            <TouchableOpacity onPress={() => step === 1 ? setOrigem(null) : setDestino(null)}>
              <Ionicons name="close-circle" size={28} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Digite para pesquisar..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        {/* Sugestões */}
        {suggestions.length > 0 && !(step === 1 ? origem : destino) && (
          <FlatList
            data={suggestions}
            keyExtractor={item => item.id.toString()}
            renderItem={renderSuggestion}
            style={styles.suggestionList}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Botão de Ação */}
        {step === 1 ? (
          <TouchableOpacity 
            style={[styles.primaryButton, !origem && styles.disabledButton]} 
            disabled={!origem}
            onPress={handleContinuar}
          >
            <Text style={styles.primaryButtonText}>Continuar para Destino</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.successButton, !destino && styles.disabledButton]} 
            disabled={!destino}
            onPress={handleIniciarSeparacao}
          >
            <Text style={styles.primaryButtonText}>Iniciar Separação</Text>
            <Ionicons name="play" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8, marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    height: 56,
  },
  searchIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  suggestionList: {
    marginTop: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    maxHeight: 250,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  suggestionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  suggestionSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981'
  },
  selectedLabel: { fontSize: 14, color: '#047857' },
  selectedText: { fontSize: 18, fontWeight: 'bold', color: '#065F46', marginTop: 4 },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto'
  },
  successButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto'
  },
  disabledButton: { backgroundColor: '#9CA3AF' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
