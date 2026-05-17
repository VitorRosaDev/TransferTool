import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, TouchableOpacity, Text } from 'react-native';
import { Home } from '../screens/Home';
import { NovaLista } from '../screens/NovaLista';
import { GerenciarCatalogo } from '../screens/GerenciarCatalogo';
import { ListasCriadas } from '../screens/ListasCriadas';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const Drawer = createDrawerNavigator();

export function DrawerRoutes() {
  const { isDark, toggleTheme, colors } = useTheme();

  const CustomDrawerContent = (props: any) => {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }} 
            onPress={toggleTheme}
          >
            <Ionicons name={isDark ? "sunny" : "moon"} size={24} color={colors.text} />
            <Text style={{ marginLeft: 16, fontSize: 16, color: colors.text, fontWeight: 'bold' }}>
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
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: isDark ? '#FFFFFF' : '#2563EB',
        drawerInactiveTintColor: colors.textMuted,
        drawerLabelStyle: { fontSize: 16 },
        drawerStyle: { backgroundColor: colors.background }
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
    </Drawer.Navigator>
  );
}
