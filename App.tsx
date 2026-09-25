import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerRoutes } from './src/routes/Drawer';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { setupDatabase, seedDatabase } from './src/database/schema';
import { View, Text, ActivityIndicator, useColorScheme } from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';

// Mantém o splash nativo visível até o banco local ficar pronto.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Em alguns ambientes (ex.: web) o splash já foi ocultado; nada a fazer.
});

function RootApp() {
  const { isDark } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <DrawerRoutes />
    </NavigationContainer>
  );
}

function LoadingFallback() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#000000' : '#F3F4F6' }}>
      <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#2563EB'} />
      <Text style={{ marginTop: 16, color: isDark ? '#E7E9EA' : '#6B7280' }}>Carregando Banco de Dados Local...</Text>
    </View>
  );
}

export default function App() {
  const initializeDb = async (db: SQLiteDatabase) => {
    try {
      await setupDatabase(db);
      await seedDatabase(db);
    } catch (e) {
      console.error("Erro na inicialização do DB (Pode ser limitação na Web):", e);
    }
  };

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <SQLiteProvider databaseName="transfertool_v2.db" onInit={initializeDb} useSuspense>
        <ThemeProvider>
          <RootApp />
        </ThemeProvider>
      </SQLiteProvider>
    </React.Suspense>
  );
}
