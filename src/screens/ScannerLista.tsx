import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

export function ScannerLista() {
  // Pegamos o ID da lista passada pela tela anterior
  const route = useRoute();
  const { listaId } = route.params as { listaId: number };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Separação de Itens</Text>
      <Text style={styles.subtitle}>Editando a Lista ID: {listaId}</Text>
      <Text style={styles.info}>Aqui faremos a inserção dos itens usando o mesmo estilo de busca inteligente.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 },
  title: { fontSize: 24, color: '#1F2937', fontWeight: 'bold' },
  subtitle: { fontSize: 18, color: '#2563EB', marginTop: 10, fontWeight: 'bold' },
  info: { fontSize: 16, color: '#6B7280', marginTop: 20, textAlign: 'center' }
});
