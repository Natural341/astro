// Splash Screen - Modern Loading Animation
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { Colors } from '../config/theme';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation (continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 8,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ring expansion animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Navigate to Language Selection after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('LanguageSelection');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0F0F1A', '#1A1A2E', '#2D1B4E']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Expanding rings */}
        <View style={styles.ringsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.ring,
                {
                  transform: [
                    {
                      scale: Animated.add(
                        Animated.divide(Animated.modulo(ringAnim, 1), 3),
                        index * 0.33
                      ),
                    },
                  ],
                  opacity: Animated.subtract(
                    1,
                    Animated.multiply(
                      Animated.modulo(Animated.add(ringAnim, index * 0.33), 1),
                      3
                    )
                  ),
                },
              ]}
            />
          ))}
        </View>

        {/* Logo with glow */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowOpacity,
              },
            ]}
          />
          <Animated.Image
            source={require('../assets/images/start.png')}
            style={[
              styles.logo,
              {
                transform: [{ translateY: floatAnim }],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>{t('appTitle') || 'COSMOS ASTRO'}</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          {t('appDescription') || 'Yıldızlara giden yolculuk'}
        </Text>

        {/* Loading dots animation */}
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: glowOpacity,
                  transform: [{ translateY: floatAnim }]
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  ringsContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: Colors.accent.purple,
  },
  logoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.accent.purple,
    opacity: 0.3,
    filter: 'blur(30px)',
  },
  logo: {
    width: 140,
    height: 140,
    zIndex: 2,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginTop: 32,
    textShadowColor: Colors.accent.purple,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    fontWeight: '400',
    marginTop: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 48,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent.purple,
  },
});
