import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTheme } from '../contexts/ThemeContext';

export function Home() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerArea}>
        <Ionicons name="cube-outline" size={80} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>TransferTool</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Gestão de Cargas</Text>
      </View>

      <View style={styles.actionArea}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('NovaLista')}
        >
          <Ionicons name="add-circle-outline" size={28} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Montar Nova Carga</Text>
        </TouchableOpacity>
        <Text style={[styles.helperText, { color: colors.textMuted }]}>Toque acima para iniciar uma nova carga</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 8,
  },
  actionArea: {
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
      }
    }),
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
    fontSize: 14,
  }
});
