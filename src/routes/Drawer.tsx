import React, { useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, TouchableOpacity, Text } from 'react-native';
import { Home } from '../screens/Home';
import { NovaLista } from '../screens/NovaLista';
import { GerenciarCatalogo } from '../screens/GerenciarCatalogo';
import { ScannerLista } from '../screens/ScannerLista';
import { ListasCriadas } from '../screens/ListasCriadas';
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

export function DrawerRoutes() {
  const [isDark, setIsDark] = useState(false);

  const CustomDrawerContent = (props: any) => {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }}>
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }} 
            onPress={() => setIsDark(!isDark)}
          >
            <Ionicons name={isDark ? "sunny" : "moon"} size={24} color={isDark ? "#FBBF24" : "#4B5563"} />
            <Text style={{ marginLeft: 16, fontSize: 16, color: isDark ? '#F3F4F6' : '#1F2937', fontWeight: 'bold' }}>
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#111827' : '#2563EB' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: isDark ? '#60A5FA' : '#2563EB',
        drawerInactiveTintColor: isDark ? '#9CA3AF' : '#4B5563',
        drawerLabelStyle: { fontSize: 16 },
        drawerStyle: { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={Home} 
        options={{
          title: 'Início',
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen 
        name="NovaLista" 
        component={NovaLista} 
        options={{
          title: 'Listas de Rancho',
          headerShown: false,
          drawerItemStyle: { display: 'none' },
          drawerIcon: ({ color }) => <Ionicons name="list-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen 
        name="ListasCriadas" 
        component={ListasCriadas} 
        options={{
          title: 'Histórico de Cargas',
          headerShown: false,
          drawerIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen 
        name="GerenciarCatalogo" 
        component={GerenciarCatalogo} 
        options={{
          title: 'Gestão de Catálogos',
          drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen 
        name="ScannerLista" 
        component={ScannerLista} 
        options={{ 
          title: 'Adicionar Itens', 
          headerShown: false,
          drawerItemStyle: { display: 'none' } // Oculta do menu lateral
        }} 
      />
    </Drawer.Navigator>
  );
}
