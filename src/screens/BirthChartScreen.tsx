// Birth Chart Screen - Full rewrite with theme support, English UI, mat design
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TickCircleIcon, ClockIcon, ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { tracker } from '../services/eventTracker';

const { width } = Dimensions.get('window');

const BIRTH_CHART_TOKEN_COST = 40;

const CITIES = [
  // International
  'New York, US',
  'London, UK',
  'Paris, France',
  'Tokyo, Japan',
  'Berlin, Germany',
  'Rome, Italy',
  'Madrid, Spain',
  'Amsterdam, Netherlands',
  'Moscow, Russia',
  'Sydney, Australia',
  'Dubai, UAE',
  'Mumbai, India',
  'Seoul, South Korea',
  'Beijing, China',
  'Toronto, Canada',
  'Buenos Aires, Argentina',
  'Cairo, Egypt',
  'Lagos, Nigeria',
  'Mexico City, Mexico',
  'Bangkok, Thailand',
  'Sao Paulo, Brazil',
  'Los Angeles, US',
  'Chicago, US',
  'Stockholm, Sweden',
  'Vienna, Austria',
  'Athens, Greece',
  'Lisbon, Portugal',
  'Warsaw, Poland',
  'Prague, Czech Republic',
  'Budapest, Hungary',
  // Turkey
  'Istanbul, Turkey',
  'Ankara, Turkey',
  'Izmir, Turkey',
  'Bursa, Turkey',
  'Antalya, Turkey',
  'Adana, Turkey',
  'Konya, Turkey',
  'Kayseri, Turkey',
  'Mersin, Turkey',
  'Eskisehir, Turkey',
  'Diyarbakir, Turkey',
  'Samsun, Turkey',
  'Denizli, Turkey',
  'Sanliurfa, Turkey',
  'Gaziantep, Turkey',
  'Malatya, Turkey',
  'Erzurum, Turkey',
  'Trabzon, Turkey',
];

const PLANETS = [
  { name: 'Sun', symbol: '\u2609' },
  { name: 'Moon', symbol: '\u263D' },
  { name: 'Mercury', symbol: '\u263F' },
  { name: 'Venus', symbol: '\u2640' },
  { name: 'Mars', symbol: '\u2642' },
  { name: 'Jupiter', symbol: '\u2643' },
  { name: 'Saturn', symbol: '\u2644' },
  { name: 'Uranus', symbol: '\u2645' },
  { name: 'Neptune', symbol: '\u2646' },
  { name: 'Pluto', symbol: '\u2647' },
];

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '\u2648', element: 'Fire', quality: 'Cardinal', interpretation: 'Bold, ambitious, and a natural-born leader with fierce determination.' },
  { name: 'Taurus', symbol: '\u2649', element: 'Earth', quality: 'Fixed', interpretation: 'Reliable, patient, and steadfast with an appreciation for beauty and comfort.' },
  { name: 'Gemini', symbol: '\u264A', element: 'Air', quality: 'Mutable', interpretation: 'Curious, communicative, and adaptable with a quick-witted intellect.' },
  { name: 'Cancer', symbol: '\u264B', element: 'Water', quality: 'Cardinal', interpretation: 'Intuitive, nurturing, and deeply connected to emotions and home.' },
  { name: 'Leo', symbol: '\u264C', element: 'Fire', quality: 'Fixed', interpretation: 'Creative, generous, and naturally drawn to the spotlight with warm charisma.' },
  { name: 'Virgo', symbol: '\u264D', element: 'Earth', quality: 'Mutable', interpretation: 'Practical, analytical, and detail-oriented with a drive for perfection.' },
  { name: 'Libra', symbol: '\u264E', element: 'Air', quality: 'Cardinal', interpretation: 'Diplomatic, graceful, and always seeking harmony and balance in life.' },
  { name: 'Scorpio', symbol: '\u264F', element: 'Water', quality: 'Fixed', interpretation: 'Passionate, intuitive, and a master of transformation and depth.' },
  { name: 'Sagittarius', symbol: '\u2650', element: 'Fire', quality: 'Mutable', interpretation: 'Free-spirited, philosophical, and always seeking new adventures.' },
  { name: 'Capricorn', symbol: '\u2651', element: 'Earth', quality: 'Cardinal', interpretation: 'Disciplined, ambitious, and driven by responsibility and achievement.' },
  { name: 'Aquarius', symbol: '\u2652', element: 'Air', quality: 'Fixed', interpretation: 'Innovative, independent, and humanitarian with a visionary mind.' },
  { name: 'Pisces', symbol: '\u2653', element: 'Water', quality: 'Mutable', interpretation: 'Compassionate, artistic, and deeply connected to the spiritual realm.' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#EF4444',
  Earth: '#10B981',
  Air: '#60A5FA',
  Water: '#8B5CF6',
};

export const BirthChartScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark, accent } = useTheme();
  const { t } = useTranslation();
  const { user, removeTokens } = useStore();

  // States
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [modalType, setModalType] = useState<'date' | 'time' | 'city' | null>(null);

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tracker.track('screen_view', { screen: 'BirthChart' });

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Helpers
  const getFormattedDate = () => {
    if (!selectedDay || !selectedMonth || !selectedYear) return 'Select Date';
    return `${selectedDay} ${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  };

  const getFormattedTime = () => {
    if (selectedHour === null || selectedMinute === null) return 'Select Time';
    return `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  };

  const filterCities = () => {
    if (!citySearch) return CITIES;
    return CITIES.filter((c: string) => c.toLowerCase().includes(citySearch.toLowerCase()));
  };

  // Deterministic pseudo-random
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const getSunSign = (d: number, m: number) => {
    const days = [21, 20, 21, 21, 22, 22, 23, 23, 23, 23, 22, 22];
    let index = m - 1;
    if (d < days[index]) {
      index = index - 1;
    }
    if (index < 0) {
      index = 11;
    }
    return ZODIAC_SIGNS[(index + 12 - 2) % 12];
  };

  const checkAndDeductTokens = (): boolean => {
    const ok = removeTokens(BIRTH_CHART_TOKEN_COST);
    if (!ok) {
      Alert.alert(
        'Insufficient Tokens',
        `You need at least ${BIRTH_CHART_TOKEN_COST} Moon Tokens for a birth chart analysis.`,
        [
          { text: 'Get Tokens', onPress: () => navigation.navigate('Premium' as never) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
    return ok;
  };

  const calculateChart = async () => {
    if (!selectedDay || !selectedMonth || !selectedYear || selectedHour === null || !selectedCity) return;

    if (!checkAndDeductTokens()) return;

    setIsCalculating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tracker.track('feature_tap', { feature: 'birth_chart' });

    setTimeout(() => {
      const sunSign = getSunSign(selectedDay, selectedMonth);
      const seed = selectedYear * 10000 + selectedMonth * 100 + selectedDay + selectedHour + (selectedMinute || 0);

      const risingIndex = Math.floor(seededRandom(seed) * 12);
      const risingSign = ZODIAC_SIGNS[risingIndex];

      const moonIndex = Math.floor(seededRandom(seed + 1) * 12);
      const moonSign = ZODIAC_SIGNS[moonIndex];

      const planetPositions = PLANETS.map((p, i) => ({
        ...p,
        sign: p.name === 'Sun' ? sunSign : ZODIAC_SIGNS[Math.floor(seededRandom(seed + i + 2) * 12)],
        degree: Math.floor(seededRandom(seed + i + 10) * 30),
      }));

      // Calculate elements & qualities
      const elements: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
      const qualities: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };

      planetPositions.forEach((p) => {
        const s = p.sign;
        if (elements[s.element] !== undefined) elements[s.element]++;
        if (qualities[s.quality] !== undefined) qualities[s.quality]++;
      });
      // Add rising sign
      if (elements[risingSign.element] !== undefined) elements[risingSign.element]++;
      if (qualities[risingSign.quality] !== undefined) qualities[risingSign.quality]++;

      setResult({ sunSign, moonSign, risingSign, planets: planetPositions, elements, qualities });
      setIsCalculating(false);
      setShowResult(true);

      tracker.track('feature_complete', { feature: 'birth_chart' });
    }, 1200);
  };

  // Max element/quality value for bar width calculation
  const getMaxValue = (obj: Record<string, number>) => Math.max(...Object.values(obj), 1);

  // ─── Zodiac Wheel ───────────────────────────────────────────────────
  const renderWheel = () => (
    <View style={styles.wheelContainer}>
      <View style={[styles.centerPlanet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="planet" size={56} color={accent.purple} />
      </View>
      <Animated.View
        style={[
          styles.orbitContainer,
          { borderColor: colors.border, transform: [{ rotate: spin }] },
        ]}
      >
        {ZODIAC_SIGNS.map((sign, index) => (
          <View
            key={index}
            style={[
              styles.orbitItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 18,
                transform: [{ rotate: `${index * 30}deg` }, { translateY: -110 }],
              },
            ]}
          >
            <Text
              style={[
                styles.orbitSymbol,
                { color: colors.text, transform: [{ rotate: `-${index * 30}deg` }] },
              ]}
            >
              {sign.symbol}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );

  // ─── Input View ─────────────────────────────────────────────────────
  const renderInputView = () => (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.title, { color: colors.text }]}>{t('birthChartUpper')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Discover the position of the stars at your birth.
        </Text>

        {renderWheel()}

        <View style={styles.formContainer}>
          {/* Date Input */}
          <TouchableOpacity
            style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setModalType('date')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="calendar-outline" size={22} color={accent.purple} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>{t('birthDateUpper')}</Text>
              <Text style={[styles.inputValue, { color: selectedDay ? colors.text : colors.textTertiary }]}>
                {getFormattedDate()}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Time & City Row */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.inputCard, { flex: 1.5, backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setModalType('time')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                <ClockIcon size={22} color={accent.purple} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>{t('birthTimeUpper')}</Text>
                <Text
                  style={[
                    styles.inputValue,
                    { color: selectedHour !== null ? colors.text : colors.textTertiary },
                  ]}
                >
                  {getFormattedTime()}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inputCard, { flex: 2, backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                setCitySearch('');
                setModalType('city');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="location-outline" size={22} color={accent.purple} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>{t('birthCityUpper')}</Text>
                <Text
                  style={[
                    styles.inputValue,
                    { color: selectedCity ? colors.text : colors.textTertiary },
                  ]}
                  numberOfLines={1}
                >
                  {selectedCity ? selectedCity.split(',')[0] : 'Select'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Calculate Button */}
          <TouchableOpacity
            style={[
              styles.calcButton,
              { backgroundColor: accent.purple },
              (!selectedDay || selectedHour === null || !selectedCity) && styles.disabledButton,
            ]}
            onPress={calculateChart}
            disabled={!selectedDay || selectedHour === null || !selectedCity || isCalculating}
            activeOpacity={0.8}
          >
            {isCalculating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.calcButtonInner}>
                <Text style={styles.calcButtonText}>{t('calculate')}</Text>
                <View style={styles.tokenBadge}>
                  <Ionicons name="diamond-outline" size={14} color="#FFF" />
                  <Text style={styles.tokenBadgeText}>{BIRTH_CHART_TOKEN_COST}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Info hint */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
            <Text style={[styles.infoText, { color: colors.textTertiary }]}>
              Enter the exact time for accurate results.
            </Text>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </Animated.View>
  );

  // ─── Result View ────────────────────────────────────────────────────
  const renderResultView = () => {
    const maxElement = getMaxValue(result.elements);
    const maxQuality = getMaxValue(result.qualities);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHeader}>
          <TouchableOpacity onPress={() => setShowResult(false)} style={styles.backBtn}>
            <ArrowCircleLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.titleSmall, { color: colors.text }]}>{t('analysisResult')}</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Sun Sign Card */}
        <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.analysisTitle, { color: colors.textTertiary }]}>{t('yourSunSign')}</Text>
          <View style={styles.analysisRow}>
            <View style={[styles.signCircle, { backgroundColor: colors.surface }]}>
              <Text style={styles.analysisSymbol}>{result.sunSign.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.analysisName, { color: colors.text }]}>{result.sunSign.name}</Text>
              <Text style={[styles.analysisElement, { color: ELEMENT_COLORS[result.sunSign.element] }]}>
                {result.sunSign.element} / {result.sunSign.quality}
              </Text>
              <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
                {result.sunSign.interpretation}
              </Text>
            </View>
          </View>
        </View>

        {/* Moon Sign Card */}
        <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.analysisTitle, { color: colors.textTertiary }]}>{t('yourMoonSign')}</Text>
          <View style={styles.analysisRow}>
            <View style={[styles.signCircle, { backgroundColor: colors.surface }]}>
              <Text style={styles.analysisSymbol}>{result.moonSign.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.analysisName, { color: colors.text }]}>{result.moonSign.name}</Text>
              <Text style={[styles.analysisElement, { color: ELEMENT_COLORS[result.moonSign.element] }]}>
                {result.moonSign.element} / {result.moonSign.quality}
              </Text>
              <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
                {result.moonSign.interpretation}
              </Text>
            </View>
          </View>
        </View>

        {/* Rising Sign Card */}
        <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.analysisTitle, { color: colors.textTertiary }]}>{t('yourRisingSign')}</Text>
          <View style={styles.analysisRow}>
            <View style={[styles.signCircle, { backgroundColor: colors.surface }]}>
              <Text style={styles.analysisSymbol}>{result.risingSign.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.analysisName, { color: colors.text }]}>{result.risingSign.name}</Text>
              <Text style={[styles.analysisElement, { color: ELEMENT_COLORS[result.risingSign.element] }]}>
                {result.risingSign.element} / {result.risingSign.quality}
              </Text>
              <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
                {result.risingSign.interpretation}
              </Text>
            </View>
          </View>
        </View>

        {/* Planets Grid */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>{t('planetPositions')}</Text>
        <View style={styles.planetsGrid}>
          {result.planets.map((planet: any, i: number) => (
            <View
              key={i}
              style={[styles.planetGridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.planetItemTop}>
                <Text style={[styles.planetGridSymbol, { color: accent.purple }]}>{planet.symbol}</Text>
                <Text style={[styles.planetGridName, { color: colors.text }]}>{planet.name}</Text>
              </View>
              <Text style={[styles.planetGridPos, { color: colors.textSecondary }]}>
                {planet.sign.symbol} {planet.sign.name} {planet.degree}\u00B0
              </Text>
            </View>
          ))}
        </View>

        {/* Element Balance */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>{t('elementBalance')}</Text>
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {Object.entries(result.elements).map(([key, val]: [string, any]) => (
            <View key={key} style={styles.barRow}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{key}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: ELEMENT_COLORS[key] || accent.purple,
                      width: `${(val / maxElement) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barValue, { color: colors.text }]}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Quality Balance */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>{t('qualityBalance')}</Text>
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {Object.entries(result.qualities).map(([key, val]: [string, any]) => (
            <View key={key} style={styles.barRow}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{key}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: accent.purple,
                      width: `${(val / maxQuality) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barValue, { color: colors.text }]}>{val}</Text>
            </View>
          ))}
        </View>

        {/* New Calculation Button */}
        <TouchableOpacity
          style={[styles.bottomBackButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setShowResult(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
          <Text style={[styles.bottomBackText, { color: colors.text }]}>{t('newCalculation')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  // ─── Date Modal ─────────────────────────────────────────────────────
  const renderDateModal = () => (
    <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
      <View style={styles.pickerHeader}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('selectDate')}</Text>
        <TouchableOpacity onPress={() => setModalType(null)}>
          <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <View style={styles.multiPickerWrapper}>
        {/* Day */}
        <ScrollView
          style={[styles.columnScroll, { backgroundColor: colors.surface }]}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setSelectedDay(d)}
              style={[
                styles.pickerItem,
                selectedDay === d && { backgroundColor: accent.purple, borderRadius: 10 },
              ]}
            >
              <Text
                style={[
                  styles.pickerText,
                  { color: colors.textSecondary },
                  selectedDay === d && { color: '#FFF', fontWeight: '700' },
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Month */}
        <ScrollView
          style={[styles.columnScroll, { flex: 1.5, backgroundColor: colors.surface }]}
          showsVerticalScrollIndicator={false}
        >
          {MONTHS.map((m, i) => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMonth(i + 1)}
              style={[
                styles.pickerItem,
                selectedMonth === i + 1 && { backgroundColor: accent.purple, borderRadius: 10 },
              ]}
            >
              <Text
                style={[
                  styles.pickerText,
                  { color: colors.textSecondary },
                  selectedMonth === i + 1 && { color: '#FFF', fontWeight: '700' },
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Year */}
        <ScrollView
          style={[styles.columnScroll, { backgroundColor: colors.surface }]}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 100 }, (_, i) => 2026 - i).map((y) => (
            <TouchableOpacity
              key={y}
              onPress={() => setSelectedYear(y)}
              style={[
                styles.pickerItem,
                selectedYear === y && { backgroundColor: accent.purple, borderRadius: 10 },
              ]}
            >
              <Text
                style={[
                  styles.pickerText,
                  { color: colors.textSecondary },
                  selectedYear === y && { color: '#FFF', fontWeight: '700' },
                ]}
              >
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: accent.purple }]}
        onPress={() => setModalType(null)}
        activeOpacity={0.8}
      >
        <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Time Modal ─────────────────────────────────────────────────────
  const renderTimeModal = () => (
    <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
      <View style={styles.pickerHeader}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('selectTime')}</Text>
        <TouchableOpacity onPress={() => setModalType(null)}>
          <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <View style={styles.multiPickerWrapper}>
        {/* Hour */}
        <ScrollView
          style={[styles.columnScroll, { backgroundColor: colors.surface }]}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <TouchableOpacity
              key={h}
              onPress={() => setSelectedHour(h)}
              style={[
                styles.pickerItem,
                selectedHour === h && { backgroundColor: accent.purple, borderRadius: 10 },
              ]}
            >
              <Text
                style={[
                  styles.pickerText,
                  { color: colors.textSecondary },
                  selectedHour === h && { color: '#FFF', fontWeight: '700' },
                ]}
              >
                {h.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ fontSize: 28, fontWeight: '700', alignSelf: 'center', color: colors.text }}>:</Text>

        {/* Minute */}
        <ScrollView
          style={[styles.columnScroll, { backgroundColor: colors.surface }]}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 60 }, (_, i) => i).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMinute(m)}
              style={[
                styles.pickerItem,
                selectedMinute === m && { backgroundColor: accent.purple, borderRadius: 10 },
              ]}
            >
              <Text
                style={[
                  styles.pickerText,
                  { color: colors.textSecondary },
                  selectedMinute === m && { color: '#FFF', fontWeight: '700' },
                ]}
              >
                {m.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: accent.purple }]}
        onPress={() => setModalType(null)}
        activeOpacity={0.8}
      >
        <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── City Modal ─────────────────────────────────────────────────────
  const renderCityModal = () => (
    <View style={[styles.cityModalContainer, { backgroundColor: colors.background }]}>
      <View style={styles.pickerHeader}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('birthCityUpper')}</Text>
        <TouchableOpacity onPress={() => setModalType(null)}>
          <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('searchCity')}
          placeholderTextColor={colors.textTertiary}
          value={citySearch}
          onChangeText={setCitySearch}
          autoFocus
        />
      </View>
      <FlatList
        data={filterCities()}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.cityItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              setSelectedCity(item);
              setModalType(null);
            }}
          >
            <Text style={[styles.cityItemText, { color: colors.text }]}>{item}</Text>
            {selectedCity === item && <TickCircleIcon size={22} color={accent.purple} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );

  // ─── Main Render ────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowCircleLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>{t('birthChartUpper')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {showResult ? renderResultView() : renderInputView()}

        <Modal visible={modalType !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            {modalType === 'date' && renderDateModal()}
            {modalType === 'time' && renderTimeModal()}
            {modalType === 'city' && renderCityModal()}
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 2,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  headerSpacer: {
    height: 10,
  },

  // Wheel
  wheelContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  centerPlanet: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  orbitContainer: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitItem: {
    position: 'absolute',
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitSymbol: {
    fontSize: 18,
  },

  // Form
  formContainer: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  inputValue: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Calculate Button
  calcButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  calcButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calcButtonText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#FFF',
    letterSpacing: 1,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tokenBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  disabledButton: {
    opacity: 0.4,
  },

  // Info
  infoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
  },

  // Result
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 4,
  },
  analysisCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  analysisTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  signCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisSymbol: {
    fontSize: 32,
  },
  analysisName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  analysisElement: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Planets
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 14,
    marginTop: 12,
  },
  planetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  planetGridItem: {
    width: (width - 50) / 2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  planetItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  planetGridSymbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  planetGridName: {
    fontSize: 14,
    fontWeight: '700',
  },
  planetGridPos: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Balance bars
  balanceCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
    gap: 14,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 72,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 10,
  },
  barValue: {
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
  },

  // Bottom button
  bottomBackButton: {
    marginTop: 28,
    marginBottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderRadius: 16,
    width: '80%',
  },
  bottomBackText: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    height: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  multiPickerWrapper: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  columnScroll: {
    flex: 1,
    borderRadius: 14,
  },
  pickerItem: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
  },
  confirmButton: {
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
    color: '#FFF',
  },

  // City modal
  cityModalContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    height: 24,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cityItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
