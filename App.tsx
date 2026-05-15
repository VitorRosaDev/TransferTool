import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerRoutes } from './src/routes/Drawer';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { setupDatabase, seedDatabase } from './src/database/schema';
import { View, Text, ActivityIndicator } from 'react-native';

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
    <React.Suspense fallback={
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Carregando Banco de Dados Local...</Text>
      </View>
    }>
      <SQLiteProvider databaseName="transfertool_v2.db" onInit={initializeDb} useSuspense>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#2563EB" />
          <DrawerRoutes />
        </NavigationContainer>
      </SQLiteProvider>
    </React.Suspense>
  );
}
