import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ListaHist } from '../models/ListaModel';
import { useTheme } from '../contexts/ThemeContext';

interface ListaCardProps {
  item: ListaHist;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  estaCarregando: boolean;
  cardWidth: number;
  onToggleDetails: () => void;
  onDelete: () => void;
}

const formatFriendlyDate = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
};

export function ListaCard({ item, index, isSelected, isExpanded, estaCarregando, cardWidth, onToggleDetails, onDelete }: ListaCardProps) {
  const { colors } = useTheme();
  const isConsolidada = item.status === 'Consolidada';
  const isExportada = item.status === 'Exportada';

  return (
    <View
      style={[
        styles.card,
        { width: cardWidth },
        { backgroundColor: colors.card },
        isSelected && {
          borderColor: item.status === 'Consolidada'
            ? colors.success
            : item.status === 'Exportada'
              ? colors.info
              : colors.warning,
          borderWidth: 2, elevation: 4
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Lista #{index + 1}</Text>
        <View style={[
          styles.badge,
          isConsolidada ? styles.badgeConsolidada :
            isExportada ? styles.badgeExportada : styles.badgeRascunho,
        ]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
        {estaCarregando && <ActivityIndicator size="small" color={colors.primary} />}
        <TouchableOpacity
          onPress={onDelete}
          disabled={estaCarregando}
          style={[styles.deleteBtn, estaCarregando && styles.acaoDesabilitada]}
          accessibilityRole="button"
          accessibilityLabel="Excluir carga"
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.routeContainer, { backgroundColor: colors.background }, isExpanded && styles.routeContainerExpanded]}
        activeOpacity={0.75}
        onPress={onToggleDetails}
        disabled={estaCarregando}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Recolher detalhes da carga' : 'Expandir detalhes da carga'}
      >
        {isExpanded ? (
          <>
            <View style={styles.routePointExpanded}>
              <Text style={[styles.routeLabel, { color: colors.textMuted }]}>Origem</Text>
              <Text style={[styles.routeText, { color: colors.text }]}>{item.origem_nome}</Text>
            </View>
            <Ionicons
              name="arrow-down"
              size={14}
              color={colors.textMuted}
              style={styles.routeArrowExpanded}
            />
            <View style={styles.routePointExpanded}>
              <Text style={[styles.routeLabel, { color: colors.textMuted }]}>Destino</Text>
              <Text style={[styles.routeText, { color: colors.text }]}>{item.destino_nome}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.collapsedRouteText, { color: colors.text }]}>Origem: {item.origem_codigo}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textMuted} style={styles.routeArrow} />
            <Text style={[styles.collapsedRouteText, { color: colors.text }]}>Destino: {item.destino_codigo}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.cardFooterInline}>
        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
        <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatFriendlyDate(item.data_criacao)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeRascunho: { backgroundColor: '#FEF3C7' },
  badgeConsolidada: { backgroundColor: '#D1FAE5' },
  badgeExportada: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#1F2937' },
  deleteBtn: { padding: 4 },
  acaoDesabilitada: { opacity: 0.45 },
  routeContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginTop: 8 },
  routeContainerExpanded: { flexDirection: 'column', alignItems: 'stretch', paddingVertical: 12 },
  routePointExpanded: { width: '100%' },
  routeLabel: { fontSize: 10, marginBottom: 2 },
  routeText: { fontSize: 12, fontWeight: '600' },
  collapsedRouteText: { flex: 1, fontSize: 12, fontWeight: '600' },
  routeArrow: { marginHorizontal: 4 },
  routeArrowExpanded: { alignSelf: 'center', marginVertical: 6 },
  cardFooterInline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  dateText: { fontSize: 10 },
});
