import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  headerBg: string;
};

export type ThemeType = 'light' | 'dark';

export interface ThemeContextData {
  themeType: ThemeType;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const lightTheme: ThemeColors = {
  background: '#F3F4F6',
  card: '#FFFFFF',
  text: '#1F2937',
  textMuted: '#6B7280',
  border: '#D1D5DB',
  primary: '#2563EB',
  danger: '#EF4444',
  success: '#10B981',
  headerBg: '#2563EB', // Fundo azul no header light
};

const darkTheme: ThemeColors = {
  background: '#000000',     // All Black X
  card: '#16181C',           // Cards
  text: '#E7E9EA',           // Texto Branco
  textMuted: '#71767A',      // Texto Cinza
  border: '#2F3336',         // Bordas escuras
  primary: '#2563EB',        // Mantido azul
  danger: '#F4212E',         // Vermelho estilo X
  success: '#00BA7C',        // Verde estilo X
  headerBg: '#000000',       // Header All Black
};

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeType, setThemeType] = useState<ThemeType>('light');

  const toggleTheme = () => {
    setThemeType(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = themeType === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeType, isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
