import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface NovaCargaCardProps {
  cardWidth: number;
  onPress: () => void;
}

export function NovaCargaCard({ cardWidth, onPress }: NovaCargaCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Montar nova carga"
    >
      <Ionicons name="add-circle-outline" size={42} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>Nova Carga</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    height: 130,
    padding: 16,
    marginHorizontal: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  title: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
});
