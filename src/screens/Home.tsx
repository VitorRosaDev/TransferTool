import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

export function Home() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Ionicons name="cube-outline" size={80} color="#2563EB" />
        <Text style={styles.title}>TransferTool</Text>
        <Text style={styles.subtitle}>Gestão de Cargas Offline</Text>
      </View>

      <View style={styles.actionArea}>
        <TouchableOpacity 
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('NovaLista')}
        >
          <Ionicons name="add-circle-outline" size={28} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Montar Nova Carga</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>Toque acima para iniciar um novo rancho</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Cor de fundo do sistema
    padding: 24,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
  },
  actionArea: {
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    elevation: 4, // Sombra no Android
    shadowColor: '#2563EB', // Sombra no iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  helperText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 14,
  }
});
