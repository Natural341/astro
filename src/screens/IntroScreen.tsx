// Intro / onboarding tour — 3 swipeable slides, first launch only.
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { useTranslation } from '../hooks/useTranslation';
import { MagicStarIcon, MoonIcon, SparklesIcon } from '../components/icons';

const { width } = Dimensions.get('window');

export const IntroScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const slides = [
    { Icon: MagicStarIcon, title: t('onboardingTitle1'), subtitle: t('onboardingSubtitle1'), desc: t('onboardingDesc1') },
    { Icon: MoonIcon, title: t('onboardingTitle2'), subtitle: t('onboardingSubtitle2'), desc: t('onboardingDesc2') },
    { Icon: SparklesIcon, title: t('onboardingTitle3'), subtitle: t('onboardingSubtitle3'), desc: t('onboardingDesc3') },
  ];

  const finish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const next = () => {
    Haptics.selectionAsync();
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0C24', '#1A1A2E', '#2D1B4E']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Skip */}
        <TouchableOpacity style={styles.skip} onPress={finish}>
          <Text style={styles.skipText}>{t('skip')}</Text>
        </TouchableOpacity>

        <FlatList
          ref={listRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.iconWrap}>
                <item.Icon size={72} color="#C4B5FD" />
              </View>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          )}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.btn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.btnText}>{index < slides.length - 1 ? t('next') : t('getStarted')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0C24' },
  skip: { alignSelf: 'flex-end', padding: 16, marginRight: 8 },
  skipText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  iconWrap: {
    width: 150, height: 150, borderRadius: 75, marginBottom: 48,
    backgroundColor: 'rgba(157,78,221,0.15)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  subtitle: { color: '#A855F7', fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  desc: { color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 22, backgroundColor: '#9D4EDD' },
  btn: {
    backgroundColor: '#9D4EDD', marginHorizontal: 32, marginBottom: 24,
    paddingVertical: 16, borderRadius: 16, alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
