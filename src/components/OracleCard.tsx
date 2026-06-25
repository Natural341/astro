// Daily Oracle Card Component
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing, BorderRadius, FontSizes } from '../config/theme';

export const OracleCard: React.FC = () => {
  const { t, language } = useTranslation();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [oracleText, setOracleText] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    // Rotating animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    loadDailyOracle();
  }, []);

  const loadDailyOracle = async () => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = await AsyncStorage.getItem('daily_oracle_date');
    const savedText = await AsyncStorage.getItem('daily_oracle_text');

    if (savedDate === today && savedText) {
      setOracleText(savedText);
      setShowAnswer(true);
    } else {
      generateDailyOracle();
    }
  };

  const generateDailyOracle = async () => {
    const messages = [
      t('dailyOracle1'), t('dailyOracle2'), t('dailyOracle3'), t('dailyOracle4'),
      t('dailyOracle5'), t('dailyOracle6'), t('dailyOracle7'), t('dailyOracle8'),
      t('dailyOracle9'), t('dailyOracle10'), t('dailyOracle11'), t('dailyOracle12'),
      t('dailyOracle13'), t('dailyOracle14'), t('dailyOracle15'), t('dailyOracle16'),
      t('dailyOracle17'), t('dailyOracle18'), t('dailyOracle19'), t('dailyOracle20'),
      t('dailyOracle21'), t('dailyOracle22'), t('dailyOracle23'), t('dailyOracle24'),
      t('dailyOracle25'), t('dailyOracle26'), t('dailyOracle27'), t('dailyOracle28'),
      t('dailyOracle29'), t('dailyOracle30'), t('dailyOracle31'),
    ];

    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const messageIndex = dayOfYear % messages.length;
    const selectedText = messages[messageIndex];

    await AsyncStorage.setItem('daily_oracle_date', today.toISOString().split('T')[0]);
    await AsyncStorage.setItem('daily_oracle_text', selectedText);

    setOracleText(selectedText);
    setShowAnswer(true);
  };

  const handleTap = () => {
    if (!showAnswer) {
      setShowAnswer(true);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getMonthName = (month: number): string => {
    const months = [
      t('january'), t('february'), t('march'), t('april'),
      t('may'), t('june'), t('july'), t('august'),
      t('september'), t('october'), t('november'), t('december'),
    ];
    return months[month];
  };

  const today = new Date();
  const dateString = `${today.getDate()} ${getMonthName(today.getMonth())} ${today.getFullYear()}`;

  return (
    <TouchableOpacity onPress={handleTap} activeOpacity={0.9} style={styles.wrapper}>
      <LinearGradient
        colors={['#2D1B4E', '#1A1A2E', '#0F0F1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Rotating background element */}
        <Animated.View
          style={[
            styles.rotatingElement,
            { transform: [{ rotate: spin }] },
          ]}
        >
          <View style={styles.starPlaceholder}>
            <Image
              source={require('../assets/images/start.png')}
              style={styles.starImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('dailyMessage').toUpperCase()}</Text>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>{t('seekingAnswer')}</Text>
            <Text style={styles.oracleText} numberOfLines={2}>
              {showAnswer ? oracleText : t('seekingAnswer')}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.dateText}>
              {showAnswer ? dateString : t('loading')}
            </Text>
            <View style={styles.tapIcon}>
              <Ionicons name="finger-print" size={18} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.lg,
  },
  container: {
    height: 260,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rotatingElement: {
    position: 'absolute',
    right: -50,
    top: -50,
  },
  starPlaceholder: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starImage: {
    width: 200,
    height: 200,
    opacity: 0.15,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 32,
  },
  oracleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  tapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
