import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface Colors {
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  card: string;
  shadow: string;
  inputBackground: string;
  buttonText: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: Colors;
}

const lightColors: Colors = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  primary: '#FF6B35',
  primaryLight: '#FFE5D9',
  card: '#F5F5F5',
  shadow: 'rgba(0, 0, 0, 0.1)',
  inputBackground: '#F8F8F8',
  buttonText: '#FFFFFF',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF3B30',
};

const darkColors: Colors = {
  background: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  card: '#2A2A2A',
  shadow: 'rgba(0, 0, 0, 0.5)',
  inputBackground: '#2A2A2A',
  buttonText: '#FFFFFF',
  success: '#66BB6A',
  warning: '#FFA726',
  error: '#EF5350',
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  const theme: Theme = {
    mode: isDark ? 'dark' : 'light',
    colors: isDark ? darkColors : lightColors,
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
