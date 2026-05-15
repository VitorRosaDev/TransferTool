import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Home } from '../screens/Home';
import { NovaLista } from '../screens/NovaLista';
import { GerenciarCatalogo } from '../screens/GerenciarCatalogo';
import { ScannerLista } from '../screens/ScannerLista';
import { ListasCriadas } from '../screens/ListasCriadas';
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

export function DrawerRoutes() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#2563EB' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#2563EB',
        drawerLabelStyle: { fontSize: 16 },
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
