import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function GerenciarCatalogo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestão de Catálogo (Em Breve)</Text>
      <Text style={styles.subtitle}>Aqui criaremos o CRUD de itens e depósitos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  title: { fontSize: 20, color: '#1F2937', fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 10 }
});
