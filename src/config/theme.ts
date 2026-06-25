// Theme Configuration - Renk ve stil tanimlari

export const Colors = {
  // Primary gradient colors
  primaryGradient: ['#667eea', '#764ba2'],

  // Dark theme
  dark: {
    background: 'transparent',
    card: '#1A1A2E',
    surface: '#16213E',
    surfaceVariant: '#1E1E32',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.54)',
    textTertiary: 'rgba(255, 255, 255, 0.38)',
    border: 'rgba(255, 255, 255, 0.10)',
    divider: 'rgba(255, 255, 255, 0.12)',
    icon: 'rgba(255, 255, 255, 0.70)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    gradientStart: '#0F0C24',
    gradientEnd: '#000000',
  },

  // Light theme
  light: {
    background: '#FFFFFF',
    card: '#F8F4FF',
    surface: '#F5F3FF',
    surfaceVariant: '#F0EEFF',
    text: 'rgba(0, 0, 0, 0.87)',
    textSecondary: 'rgba(0, 0, 0, 0.54)',
    textTertiary: 'rgba(0, 0, 0, 0.38)',
    border: 'rgba(0, 0, 0, 0.08)',
    divider: 'rgba(0, 0, 0, 0.12)',
    icon: 'rgba(0, 0, 0, 0.54)',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    gradientStart: '#F8F4FF',
    gradientEnd: '#FFFFFF',
  },

  // Accent colors
  accent: {
    purple: '#9D4EDD',
    pink: '#FF4081',
    blue: '#6C63FF',
    cyan: '#00E5FF',
    green: '#4CAF50',
    orange: '#FF9800',
    red: '#E74C3C',
    gold: '#FFD700',
    magenta: '#FF00FF',
    brown: '#6F4E37',
  },
};

export type ThemeMode = 'dark' | 'light';

export const getThemeColors = (mode: ThemeMode) => {
  return mode === 'dark' ? Colors.dark : Colors.light;
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 26,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
