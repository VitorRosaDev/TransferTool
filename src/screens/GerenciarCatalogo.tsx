import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../contexts/ThemeContext';
import { CatalogoModel } from '../models/CatalogoModel';

type ActionType = 'adicionar' | 'remover' | 'reativar';
type CategoryType = 'deposito' | 'escola' | 'item';

export function GerenciarCatalogo() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [step, setStep] = useState(1);
  const [action, setAction] = useState<ActionType | null>(null);
  const [category, setCategory] = useState<CategoryType | null>(null);

  const reset = () => {
    setStep(1);
    setAction(null);
    setCategory(null);
  };

  const renderStep1 = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>O que deseja fazer?</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Escolha a ação principal para o catálogo</Text>

      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: colors.card }]}
        onPress={() => { setAction('adicionar'); setStep(2); }}
      >
        <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Adicionar Novo</Text>
          <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Inserir novo depósito, escola ou item</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: colors.card }]}
        onPress={() => { setAction('remover'); setStep(2); }}
      >
        <Ionicons name="trash-outline" size={32} color="#EF4444" />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Remover (Desativar)</Text>
          <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Ocultar itens ativos do sistema</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: colors.card }]}
        onPress={() => { setAction('reativar'); setStep(2); }}
      >
        <Ionicons name="refresh-circle-outline" size={32} color="#10B981" />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Reativar</Text>
          <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Trazer itens inativos de volta</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Selecione a Categoria</Text>
      </View>
      
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Você escolheu: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{action?.toUpperCase()}</Text>
      </Text>

      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: colors.card }]}
        onPress={() => { setCategory('deposito'); setStep(3); }}
      >
        <Ionicons name="business-outline" size={32} color={colors.text} />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Depósitos</Text>
          <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Origens de carga</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: colors.card }]}
        onPress={() => { setCategory('escola'); setStep(3); }}
      >
        <Ionicons name="school-outline" size={32} color={colors.text} />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Escolas</Text>
          <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Destinos de carga</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: colors.card }]}
        onPress={() => { setCategory('item'); setStep(3); }}
      >
        <Ionicons name="cube-outline" size={32} color={colors.text} />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Itens / Produtos</Text>
          <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Catálogo de suprimentos</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
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

  const renderStep3 = () => (
    <View style={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {action === 'adicionar' ? 'Novo' : action === 'remover' ? 'Remover' : 'Reativar'} {category === 'item' ? 'Item' : category === 'deposito' ? 'Depósito' : 'Escola'}
        </Text>
      </View>
      
      {action === 'adicionar' ? renderAddForm() : (
        <View style={[styles.placeholder, { borderColor: colors.border }]}>
          <Ionicons name="construct-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>
            Interface de {action} em lote em breve...
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.resetButton, { borderColor: colors.primary }]}
        onPress={reset}
      >
        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Cancelar e Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
