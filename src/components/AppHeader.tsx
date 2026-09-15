import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

type AppHeaderProps = {
  title: string;
  navigationMode: 'back' | 'menu';
  onPress: () => void;
  action?: {
    accessibilityLabel: string;
    icon: ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
  };
};

export function AppHeader({ title, navigationMode, onPress, action }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const iconName = navigationMode === 'back' ? 'arrow-back' : 'menu';

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.headerBg,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 10,
        },
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={navigationMode === 'back' ? 'Voltar' : 'Abrir menu'}
        style={styles.navigationButton}
        onPress={onPress}
      >
        <Ionicons name={iconName} size={28} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      {action && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          style={styles.actionButton}
          onPress={action.onPress}
        >
          <Ionicons name={action.icon} size={26} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  navigationButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  actionButton: {
    padding: 8,
    marginLeft: 'auto',
    marginRight: -8,
  },
});
