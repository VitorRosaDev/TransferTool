import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';

export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
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
  warning: '#B45309',
  info: '#2563EB',
  headerBg: '#2563EB',
};

const darkTheme: ThemeColors = {
  background: '#000000',
  card: '#16181C',
  text: '#E7E9EA',
  textMuted: '#71767A',
  border: '#2F3336',
  primary: '#2563EB',
  danger: '#F4212E',
  success: '#00BA7C',
  warning: '#FBBF24',
  info: '#60A5FA',
  headerBg: '#000000',
};

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeType, setThemeType] = useState<ThemeType>('light');

  // Carregar tema persistido
  useEffect(() => {
    if (Platform.OS === 'web') {
      const saved = localStorage.getItem('@theme_type');
      if (saved === 'light' || saved === 'dark') {
        setThemeType(saved as ThemeType);
      }
    }
  }, []);

  const toggleTheme = () => {
    setThemeType(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (Platform.OS === 'web') {
        localStorage.setItem('@theme_type', next);
      }
      return next;
    });
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
