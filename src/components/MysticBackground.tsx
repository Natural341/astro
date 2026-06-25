// Mystic Background Component
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const { width, height } = Dimensions.get('window');

interface MysticBackgroundProps {
  children: React.ReactNode;
}

export const MysticBackground: React.FC<MysticBackgroundProps> = ({ children }) => {
  const { isDark } = useTheme();

  const gradientColors = isDark
    ? ['#0F0F1A', '#1A1A2E', '#16213E'] as const
    : ['#FFFFFF', '#F8F4FF', '#F0E6FF'] as const;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: width,
    minHeight: height,
  },
});
