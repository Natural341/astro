// Vedic Chart Screen - Matte Dark Theme, English UI, No Emoji
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MagicStarIcon, ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Line, Text as SvgText, Rect, G, Circle } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { tracker } from '../services/eventTracker';
import { Spacing, BorderRadius, FontSizes } from '../config/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const TOKEN_COST = 40; // Birth chart cost

// ─── DATA ────────────────────────────────────────────────────────────────────

const NAKSHATRAS = [
  { name: 'Ashwini', ruler: 'Ketu', deity: 'Ashwini Kumaras', meaning: 'Speed & Healing', element: 'Fire', quality: 'Swift, pioneering energy that initiates new beginnings and brings rapid transformation.' },
  { name: 'Bharani', ruler: 'Venus', deity: 'Yama', meaning: 'Life & Death', element: 'Earth', quality: 'Creative restraint and the power to bear and nurture life through discipline.' },
  { name: 'Krittika', ruler: 'Sun', deity: 'Agni', meaning: 'Purification & Power', element: 'Fire', quality: 'The flame of purification that cuts through illusion and reveals truth.' },
  { name: 'Rohini', ruler: 'Moon', deity: 'Brahma', meaning: 'Growth & Creation', element: 'Earth', quality: 'Fertile creativity and material abundance, the most beloved of the Moon.' },
  { name: 'Mrigashira', ruler: 'Mars', deity: 'Soma', meaning: 'Seeking & Intuition', element: 'Air', quality: 'The eternal seeker, always searching for beauty and deeper meaning.' },
  { name: 'Ardra', ruler: 'Rahu', deity: 'Rudra', meaning: 'Storm & Transformation', element: 'Water', quality: 'Destructive storms that clear the way for profound renewal and growth.' },
  { name: 'Punarvasu', ruler: 'Jupiter', deity: 'Aditi', meaning: 'Return of Light', element: 'Air', quality: 'Restoration and renewal, the ability to bounce back from any adversity.' },
  { name: 'Pushya', ruler: 'Saturn', deity: 'Brihaspati', meaning: 'Nourishing & Protective', element: 'Water', quality: 'The most auspicious nakshatra for spiritual growth and selfless service.' },
  { name: 'Ashlesha', ruler: 'Mercury', deity: 'Nagas', meaning: 'Mystery & Wisdom', element: 'Water', quality: 'Serpentine wisdom, hypnotic charm, and the power of kundalini energy.' },
  { name: 'Magha', ruler: 'Ketu', deity: 'Pitris', meaning: 'Throne & Ancestry', element: 'Fire', quality: 'Royal authority and connection to ancestral lineage and tradition.' },
  { name: 'Purva Phalguni', ruler: 'Venus', deity: 'Bhaga', meaning: 'Delight & Prosperity', element: 'Fire', quality: 'Creative expression, pleasure, and the enjoyment of life\'s blessings.' },
  { name: 'Uttara Phalguni', ruler: 'Sun', deity: 'Aryaman', meaning: 'Friendship & Patronage', element: 'Fire', quality: 'Loyal partnerships, generosity, and the fulfillment of contracts.' },
  { name: 'Hasta', ruler: 'Moon', deity: 'Savitar', meaning: 'Skill & Dexterity', element: 'Air', quality: 'Skillful hands, craftsmanship, and the ability to manifest ideas into form.' },
  { name: 'Chitra', ruler: 'Mars', deity: 'Tvashtar', meaning: 'Brilliance & Beauty', element: 'Fire', quality: 'The cosmic architect who creates beauty and structure from raw materials.' },
  { name: 'Swati', ruler: 'Rahu', deity: 'Vayu', meaning: 'Independence & Flexibility', element: 'Air', quality: 'Freedom-loving, adaptive, and able to thrive in any environment.' },
  { name: 'Vishakha', ruler: 'Jupiter', deity: 'Indra-Agni', meaning: 'Triumph & Purpose', element: 'Fire', quality: 'Single-pointed determination that achieves goals against all odds.' },
  { name: 'Anuradha', ruler: 'Saturn', deity: 'Mitra', meaning: 'Devotion & Friendship', element: 'Water', quality: 'Deep devotion, loyalty, and the ability to create lasting bonds.' },
  { name: 'Jyeshtha', ruler: 'Mercury', deity: 'Indra', meaning: 'Seniority & Protection', element: 'Water', quality: 'The chief star, commanding respect through wisdom and protective power.' },
  { name: 'Mula', ruler: 'Ketu', deity: 'Nirriti', meaning: 'Root & Foundation', element: 'Air', quality: 'The power to uproot and destroy to reach the fundamental truth.' },
  { name: 'Purva Ashadha', ruler: 'Venus', deity: 'Apas', meaning: 'Invincibility', element: 'Water', quality: 'Invincible spirit and the purifying power of water and truth.' },
  { name: 'Uttara Ashadha', ruler: 'Sun', deity: 'Vishvedevas', meaning: 'Universal Victory', element: 'Air', quality: 'Final victory that is lasting and universal, earned through righteousness.' },
  { name: 'Shravana', ruler: 'Moon', deity: 'Vishnu', meaning: 'Listening & Learning', element: 'Air', quality: 'Deep listening, learning, and the connection to cosmic knowledge.' },
  { name: 'Dhanishtha', ruler: 'Mars', deity: 'Vasus', meaning: 'Wealth & Music', element: 'Earth', quality: 'Musical talent, material wealth, and the rhythm of cosmic abundance.' },
  { name: 'Shatabhisha', ruler: 'Rahu', deity: 'Varuna', meaning: 'Hundred Healers', element: 'Air', quality: 'Mysterious healing power, solitude, and the veiling of cosmic secrets.' },
  { name: 'Purva Bhadrapada', ruler: 'Jupiter', deity: 'Aja Ekapada', meaning: 'Scorching Fire', element: 'Air', quality: 'Intense transformation through spiritual fire and ascetic discipline.' },
  { name: 'Uttara Bhadrapada', ruler: 'Saturn', deity: 'Ahir Budhnya', meaning: 'Deep Ocean', element: 'Water', quality: 'The depths of the cosmic ocean, wisdom, and spiritual completion.' },
  { name: 'Revati', ruler: 'Mercury', deity: 'Pushan', meaning: 'Nourishing Journey', element: 'Earth', quality: 'Safe passage, prosperity on the journey, and cosmic compassion.' },
];

const DOSHAS = [
  { name: 'Vata', element: 'Air + Ether', traits: 'Creative, Quick, Adaptive', icon: 'weather-windy' as const },
  { name: 'Pitta', element: 'Fire + Water', traits: 'Leader, Intelligent, Passionate', icon: 'fire' as const },
  { name: 'Kapha', element: 'Earth + Water', traits: 'Calm, Balanced, Strong', icon: 'flower' as const },
];

const PLANET_FULL_NAMES: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
};

// Vimshottari Dasha periods (years)
const DASHA_PERIODS = [
  { planet: 'Ketu', years: 7 },
  { planet: 'Venus', years: 20 },
  { planet: 'Sun', years: 6 },
  { planet: 'Moon', years: 10 },
  { planet: 'Mars', years: 7 },
  { planet: 'Rahu', years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn', years: 19 },
  { planet: 'Mercury', years: 17 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export const VedicChartScreen: React.FC = () => {
  const { colors, isDark, accent } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useStore();

  const { birthData } = (route.params as any) || {};

  const [selectedNakshatra, setSelectedNakshatra] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [chartStyle, setChartStyle] = useState<'north' | 'south'>('north');
  const [expandedNakshatra, setExpandedNakshatra] = useState<number | null>(null);

  // Saffron / gold accent - theme aware
  const saffron = isDark ? '#FF8C42' : '#E06B20';
  const gold = isDark ? '#FFD700' : '#C9A800';
  const doshaColors = {
    Vata: isDark ? '#4FC3F7' : '#0288D1',
    Pitta: isDark ? '#FF7043' : '#D84315',
    Kapha: isDark ? '#66BB6A' : '#2E7D32',
  };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    tracker.track('screen_view', { screen: 'VedicChart' });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  // Derived state from birth data or store user data
  const { userDosha, userNakshatra, nakshatraIndex, planets, dashaSequence } = useMemo(() => {
    let seed = 12345;
    if (birthData) {
      seed = birthData.year * 10000 + birthData.month * 100 + birthData.day + (birthData.hour || 0);
    } else if (user?.birthDate) {
      const parts = user.birthDate.replace(/\D/g, '');
      seed = parseInt(parts, 10) || 12345;
    } else {
      seed = Math.floor(Math.random() * 99999);
    }

    const doshaIndex = Math.floor(seededRandom(seed) * DOSHAS.length);
    const nakIdx = Math.floor(seededRandom(seed + 1) * NAKSHATRAS.length);

    const planetNames = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];
    const generatedPlanets = planetNames.map((p, i) => {
      const house = Math.floor(seededRandom(seed + i + 10) * 12) + 1;
      const degree = Math.floor(seededRandom(seed + i + 30) * 30);
      return { label: p, house, degree };
    });

    // Dasha sequence starting from nakshatra ruler
    const rulerToDasha: Record<string, number> = {
      Ketu: 0, Venus: 1, Sun: 2, Moon: 3, Mars: 4, Rahu: 5, Jupiter: 6, Saturn: 7, Mercury: 8,
    };
    const nakshatraRuler = NAKSHATRAS[nakIdx].ruler;
    const startIdx = rulerToDasha[nakshatraRuler] ?? 0;
    const dashas = [];
    let cumulativeYear = 0;
    const birthYear = birthData?.year || (user?.birthDate ? parseInt(user.birthDate.substring(0, 4)) : 2000);
    for (let i = 0; i < DASHA_PERIODS.length; i++) {
      const idx = (startIdx + i) % DASHA_PERIODS.length;
      const period = DASHA_PERIODS[idx];
      dashas.push({
        planet: period.planet,
        years: period.years,
        startYear: birthYear + cumulativeYear,
        endYear: birthYear + cumulativeYear + period.years,
      });
      cumulativeYear += period.years;
    }

    return {
      userDosha: DOSHAS[doshaIndex],
      userNakshatra: NAKSHATRAS[nakIdx],
      nakshatraIndex: nakIdx,
      planets: generatedPlanets,
      dashaSequence: dashas,
    };
  }, [birthData, user?.birthDate]);

  const currentYear = new Date().getFullYear();

  const openNakshatraModal = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNakshatra(index);
    setShowModal(true);
  }, []);

  const toggleNakshatraExpand = useCallback((index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedNakshatra(prev => prev === index ? null : index);
  }, []);

  const handleChartStyleToggle = useCallback((style: 'north' | 'south') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChartStyle(style);
  }, []);

  const doshaColor = doshaColors[userDosha.name as keyof typeof doshaColors] || saffron;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ArrowCircleLeftIcon size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t('vedicChart')}</Text>
              <Text style={[styles.headerSubtitle, { color: saffron }]}>{t('ancientWisdom')}</Text>
            </View>
            <View style={[styles.tokenBadge, { backgroundColor: isDark ? gold + '20' : gold + '15', borderColor: gold + '30' }]}>
              <Ionicons name="diamond-outline" size={14} color={gold} />
              <Text style={[styles.tokenBadgeText, { color: gold }]}>{TOKEN_COST}</Text>
            </View>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Nakshatra Hero Card ── */}
            <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.heroHeader}>
                <View style={[styles.heroBadge, { backgroundColor: saffron + '15' }]}>
                  <MagicStarIcon size={14} color={saffron} />
                  <Text style={[styles.heroBadgeText, { color: saffron }]}>Your Star</Text>
                </View>
                <Text style={[styles.heroNakshatraIndex, { color: colors.textSecondary }]}>
                  #{nakshatraIndex + 1} of 27
                </Text>
              </View>

              <View style={styles.heroContent}>
                <View style={[styles.heroIconCircle, { backgroundColor: saffron + '15', borderColor: saffron + '30' }]}>
                  <Ionicons name="star" size={36} color={saffron} />
                </View>
                <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Your Nakshatra</Text>
                <Text style={[styles.heroName, { color: colors.text }]}>{userNakshatra.name}</Text>
              </View>

              <View style={[styles.heroFooter, { borderTopColor: colors.border }]}>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, { color: colors.text }]}>{userNakshatra.ruler}</Text>
                  <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{t('ruler')}</Text>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, { color: colors.text }]}>{userNakshatra.deity}</Text>
                  <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{t('deity')}</Text>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, { color: colors.text }]}>{userNakshatra.meaning}</Text>
                  <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{t('meaning')}</Text>
                </View>
              </View>
            </View>

            {/* ── Chart Style Toggle ── */}
            <View style={styles.chartSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('kundliChart')}</Text>
              <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    chartStyle === 'north' && { backgroundColor: saffron },
                  ]}
                  onPress={() => handleChartStyleToggle('north')}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: chartStyle === 'north' ? '#FFFFFF' : colors.textSecondary },
                  ]}>{t('northIndian')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    chartStyle === 'south' && { backgroundColor: saffron },
                  ]}
                  onPress={() => handleChartStyleToggle('south')}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: chartStyle === 'south' ? '#FFFFFF' : colors.textSecondary },
                  ]}>{t('southIndian')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Kundli Chart ── */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {chartStyle === 'north' ? (
                <NorthIndianChart planets={planets} saffron={saffron} colors={colors} isDark={isDark} />
              ) : (
                <SouthIndianChart planets={planets} saffron={saffron} colors={colors} isDark={isDark} />
              )}
            </View>

            {/* ── Planet Positions ── */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: Spacing.lg }]}>{t('planetPositions')}</Text>
            <View style={[styles.planetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {planets.map((p, i) => (
                <View
                  key={i}
                  style={[
                    styles.planetRow,
                    i < planets.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.planetIcon, { backgroundColor: saffron + '15' }]}>
                    <Text style={[styles.planetLabel, { color: saffron }]}>{p.label}</Text>
                  </View>
                  <View style={styles.planetInfo}>
                    <Text style={[styles.planetName, { color: colors.text }]}>{PLANET_FULL_NAMES[p.label]}</Text>
                    <Text style={[styles.planetDetail, { color: colors.textSecondary }]}>
                      House {p.house} at {p.degree}°
                    </Text>
                  </View>
                  <Text style={[styles.planetHouse, { color: saffron }]}>H{p.house}</Text>
                </View>
              ))}
            </View>

            {/* ── Vimshottari Dasha ── */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: Spacing.lg }]}>Vimshottari Dasha Periods</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginHorizontal: Spacing.lg }]}>
              Planetary time periods governing life phases
            </Text>
            <View style={[styles.dashaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {dashaSequence.map((d, i) => {
                const isCurrent = currentYear >= d.startYear && currentYear < d.endYear;
                const isPast = currentYear >= d.endYear;
                const progress = isCurrent
                  ? Math.min(1, (currentYear - d.startYear) / d.years)
                  : isPast ? 1 : 0;

                return (
                  <View
                    key={i}
                    style={[
                      styles.dashaRow,
                      isCurrent && { backgroundColor: saffron + '10', borderRadius: BorderRadius.md },
                      i < dashaSequence.length - 1 && !isCurrent && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={styles.dashaLeft}>
                      <View style={[
                        styles.dashaDot,
                        {
                          backgroundColor: isCurrent ? saffron : isPast ? colors.textTertiary : colors.border,
                          borderColor: isCurrent ? saffron + '40' : 'transparent',
                          borderWidth: isCurrent ? 3 : 0,
                        },
                      ]} />
                      <View>
                        <Text style={[
                          styles.dashaPlanet,
                          { color: isCurrent ? saffron : isPast ? colors.textTertiary : colors.text },
                        ]}>
                          {d.planet}
                          {isCurrent && '  (Current)'}
                        </Text>
                        <Text style={[styles.dashaYears, { color: colors.textSecondary }]}>
                          {d.startYear} - {d.endYear}  ({d.years} years)
                        </Text>
                      </View>
                    </View>
                    {isCurrent && (
                      <View style={[styles.dashaProgressContainer, { backgroundColor: colors.border }]}>
                        <View style={[styles.dashaProgressBar, { width: `${progress * 100}%`, backgroundColor: saffron }]} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* ── Dosha Analysis ── */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: Spacing.lg }]}>{t('ayurvedicConstitution')}</Text>
            <View style={[styles.doshaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.doshaHeader}>
                <View style={[styles.doshaIconBox, { backgroundColor: doshaColor + '15' }]}>
                  <MaterialCommunityIcons name={userDosha.icon} size={28} color={doshaColor} />
                </View>
                <View style={styles.doshaHeaderInfo}>
                  <Text style={[styles.doshaName, { color: colors.text }]}>{userDosha.name}</Text>
                  <Text style={[styles.doshaElement, { color: colors.textSecondary }]}>{userDosha.element}</Text>
                </View>
              </View>

              <View style={styles.doshaTraitsRow}>
                {userDosha.traits.split(', ').map((trait, i) => (
                  <View key={i} style={[styles.traitChip, { backgroundColor: doshaColor + '12', borderColor: doshaColor + '25' }]}>
                    <Text style={[styles.traitChipText, { color: doshaColor }]}>{trait}</Text>
                  </View>
                ))}
              </View>

              {/* All three doshas */}
              <View style={[styles.doshaTriRow, { borderTopColor: colors.border }]}>
                {DOSHAS.map((d, i) => {
                  const dColor = doshaColors[d.name as keyof typeof doshaColors];
                  const isActive = d.name === userDosha.name;
                  return (
                    <View key={i} style={styles.doshaTriItem}>
                      <View style={[
                        styles.doshaTriIcon,
                        {
                          backgroundColor: isActive ? dColor + '20' : colors.surface,
                          borderColor: isActive ? dColor + '40' : colors.border,
                        },
                      ]}>
                        <MaterialCommunityIcons name={d.icon} size={20} color={isActive ? dColor : colors.textTertiary} />
                      </View>
                      <Text style={[
                        styles.doshaTriName,
                        { color: isActive ? dColor : colors.textTertiary, fontWeight: isActive ? '700' : '500' },
                      ]}>{d.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Nakshatra Guide (Expandable) ── */}
            <View style={styles.nakshatraHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>27 Nakshatra Guide</Text>
              <Text style={[styles.sectionSubtitleSmall, { color: colors.textSecondary }]}>
                Tap to expand
              </Text>
            </View>

            {NAKSHATRAS.map((n, i) => {
              const isExpanded = expandedNakshatra === i;
              const isUserNakshatra = i === nakshatraIndex;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.nakshatraItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: isUserNakshatra ? saffron + '40' : colors.border,
                      borderWidth: isUserNakshatra ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => toggleNakshatraExpand(i)}
                  activeOpacity={0.7}
                >
                  <View style={styles.nakshatraRow}>
                    <View style={[styles.nakshatraNum, { backgroundColor: isUserNakshatra ? saffron + '15' : colors.surface }]}>
                      <Text style={[styles.nakshatraNumText, { color: isUserNakshatra ? saffron : colors.textSecondary }]}>{i + 1}</Text>
                    </View>
                    <View style={styles.nakshatraMainInfo}>
                      <Text style={[styles.nakshatraName, { color: colors.text }]}>
                        {n.name}
                        {isUserNakshatra && (
                          <Text style={{ color: saffron, fontSize: 12 }}>  (Yours)</Text>
                        )}
                      </Text>
                      <Text style={[styles.nakshatraMeaning, { color: colors.textSecondary }]}>{n.meaning}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>

                  {isExpanded && (
                    <View style={[styles.nakshatraExpanded, { borderTopColor: colors.border }]}>
                      <View style={styles.nakshatraDetailRow}>
                        <Text style={[styles.nakshatraDetailLabel, { color: colors.textSecondary }]}>{t('ruler')}</Text>
                        <Text style={[styles.nakshatraDetailValue, { color: colors.text }]}>{n.ruler}</Text>
                      </View>
                      <View style={styles.nakshatraDetailRow}>
                        <Text style={[styles.nakshatraDetailLabel, { color: colors.textSecondary }]}>{t('deity')}</Text>
                        <Text style={[styles.nakshatraDetailValue, { color: colors.text }]}>{n.deity}</Text>
                      </View>
                      <View style={styles.nakshatraDetailRow}>
                        <Text style={[styles.nakshatraDetailLabel, { color: colors.textSecondary }]}>{t('element')}</Text>
                        <Text style={[styles.nakshatraDetailValue, { color: colors.text }]}>{n.element}</Text>
                      </View>
                      <Text style={[styles.nakshatraQuality, { color: colors.textSecondary }]}>{n.quality}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* ── Educational Cards ── */}
            <View style={styles.infoRow}>
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.infoIcon, { backgroundColor: accent.purple + '15' }]}>
                  <Ionicons name="moon-outline" size={22} color={accent.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Chandra</Text>
                  <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>{t('mirrorOfMind')}</Text>
                </View>
              </View>
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.infoIcon, { backgroundColor: accent.orange + '15' }]}>
                  <Ionicons name="sunny-outline" size={22} color={accent.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Surya</Text>
                  <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>{t('lightOfSoul')}</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </Animated.View>
        </ScrollView>

        {/* ── Nakshatra Detail Modal ── */}
        <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

              {selectedNakshatra !== null && (
                <View style={styles.modalBody}>
                  <View style={[styles.modalIconCircle, { backgroundColor: saffron + '15', borderColor: saffron + '30' }]}>
                    <Ionicons name="star" size={40} color={saffron} />
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{NAKSHATRAS[selectedNakshatra].name}</Text>
                  <Text style={[styles.modalSubtitle, { color: saffron }]}>{NAKSHATRAS[selectedNakshatra].meaning}</Text>

                  <View style={styles.modalStats}>
                    <View style={[styles.statRow, { backgroundColor: colors.surface }]}>
                      <View style={[styles.statIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="planet-outline" size={20} color={colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('rulingPlanet')}</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{NAKSHATRAS[selectedNakshatra].ruler}</Text>
                      </View>
                    </View>
                    <View style={[styles.statRow, { backgroundColor: colors.surface }]}>
                      <View style={[styles.statIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="bonfire-outline" size={20} color={colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('mythologicalDeity')}</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{NAKSHATRAS[selectedNakshatra].deity}</Text>
                      </View>
                    </View>
                    <View style={[styles.statRow, { backgroundColor: colors.surface }]}>
                      <View style={[styles.statIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="leaf-outline" size={20} color={colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('element')}</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{NAKSHATRAS[selectedNakshatra].element}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                    {NAKSHATRAS[selectedNakshatra].quality}
                  </Text>

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: saffron }]}
                    onPress={() => {
                      setShowModal(false);
                      tracker.track('feature_complete', { feature: 'vedic_nakshatra_detail', nakshatra: NAKSHATRAS[selectedNakshatra!].name });
                    }}
                  >
                    <Text style={styles.modalButtonText}>{t('close')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </View>
  );
};

// ─── NORTH INDIAN CHART (Diamond) ────────────────────────────────────────────

const NorthIndianChart = ({
  planets,
  saffron,
  colors,
  isDark,
}: {
  planets: { label: string; house: number; degree: number }[];
  saffron: string;
  colors: any;
  isDark: boolean;
}) => {
  const size = width - 64;
  const center = size / 2;
  const strokeWidth = 1.5;
  const lineColor = saffron;
  const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';

  const getHousePosition = (house: number) => {
    const positions = [
      { x: center, y: size * 0.18 },       // 1
      { x: size * 0.22, y: size * 0.1 },   // 2
      { x: size * 0.1, y: size * 0.22 },   // 3
      { x: size * 0.15, y: center },        // 4
      { x: size * 0.1, y: size * 0.78 },   // 5
      { x: size * 0.22, y: size * 0.9 },   // 6
      { x: center, y: size * 0.82 },       // 7
      { x: size * 0.78, y: size * 0.9 },   // 8
      { x: size * 0.9, y: size * 0.78 },   // 9
      { x: size * 0.85, y: center },       // 10
      { x: size * 0.9, y: size * 0.22 },   // 11
      { x: size * 0.78, y: size * 0.1 },   // 12
    ];
    return positions[house - 1] || { x: center, y: center };
  };

  return (
    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer box */}
        <Rect x="2" y="2" width={size - 4} height={size - 4} stroke={lineColor} strokeWidth={strokeWidth * 2} fill="none" rx="4" />

        {/* Diagonals */}
        <Line x1="2" y1="2" x2={size - 2} y2={size - 2} stroke={lineColor} strokeWidth={strokeWidth} strokeOpacity={0.6} />
        <Line x1={size - 2} y1="2" x2="2" y2={size - 2} stroke={lineColor} strokeWidth={strokeWidth} strokeOpacity={0.6} />

        {/* Diamond (midpoint) lines */}
        <Line x1="2" y1={center} x2={center} y2="2" stroke={lineColor} strokeWidth={strokeWidth} />
        <Line x1={center} y1="2" x2={size - 2} y2={center} stroke={lineColor} strokeWidth={strokeWidth} />
        <Line x1={size - 2} y1={center} x2={center} y2={size - 2} stroke={lineColor} strokeWidth={strokeWidth} />
        <Line x1={center} y1={size - 2} x2="2" y2={center} stroke={lineColor} strokeWidth={strokeWidth} />

        {/* House numbers */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
          const pos = getHousePosition(h);
          return (
            <SvgText key={h} x={pos.x} y={pos.y + 14} fill={textColor} fontSize="9" fontWeight="600" textAnchor="middle">
              {h}
            </SvgText>
          );
        })}

        {/* Planets */}
        {planets.map((p, i) => {
          const pos = getHousePosition(p.house);
          const offsetX = (i % 3 - 1) * 14;
          const offsetY = Math.floor(i / 3) * 12 - 8;
          return (
            <G key={i}>
              <Circle cx={pos.x + offsetX} cy={pos.y + offsetY - 2} r="11" fill={saffron} fillOpacity={0.12} />
              <SvgText
                x={pos.x + offsetX}
                y={pos.y + offsetY + 2}
                fill={saffron}
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {p.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// ─── SOUTH INDIAN CHART (Grid) ───────────────────────────────────────────────

const SouthIndianChart = ({
  planets,
  saffron,
  colors,
  isDark,
}: {
  planets: { label: string; house: number; degree: number }[];
  saffron: string;
  colors: any;
  isDark: boolean;
}) => {
  const size = width - 64;
  const cellSize = size / 4;
  const strokeWidth = 1.5;
  const lineColor = saffron;
  const textColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';

  // South Indian chart: houses fixed to grid positions
  // Layout (Pisces = House 12 starts top-left):
  //  12 |  1 |  2 |  3
  //  11 |    |    |  4
  //  10 |    |    |  5
  //   9 |  8 |  7 |  6
  const housePositions: { col: number; row: number }[] = [
    { col: 1, row: 0 }, // 1
    { col: 2, row: 0 }, // 2
    { col: 3, row: 0 }, // 3
    { col: 3, row: 1 }, // 4
    { col: 3, row: 2 }, // 5
    { col: 3, row: 3 }, // 6
    { col: 2, row: 3 }, // 7
    { col: 1, row: 3 }, // 8
    { col: 0, row: 3 }, // 9
    { col: 0, row: 2 }, // 10
    { col: 0, row: 1 }, // 11
    { col: 0, row: 0 }, // 12
  ];

  const getHouseCenter = (house: number) => {
    const pos = housePositions[house - 1];
    return { x: pos.col * cellSize + cellSize / 2, y: pos.row * cellSize + cellSize / 2 };
  };

  // Group planets by house
  const planetsByHouse: Record<number, typeof planets> = {};
  planets.forEach(p => {
    if (!planetsByHouse[p.house]) planetsByHouse[p.house] = [];
    planetsByHouse[p.house].push(p);
  });

  return (
    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer border */}
        <Rect x="2" y="2" width={size - 4} height={size - 4} stroke={lineColor} strokeWidth={strokeWidth * 2} fill="none" rx="4" />

        {/* Grid lines */}
        {[1, 2, 3].map(i => (
          <React.Fragment key={i}>
            <Line x1={i * cellSize} y1="2" x2={i * cellSize} y2={size - 2} stroke={lineColor} strokeWidth={strokeWidth} strokeOpacity={0.5} />
            <Line x1="2" y1={i * cellSize} x2={size - 2} y2={i * cellSize} stroke={lineColor} strokeWidth={strokeWidth} strokeOpacity={0.5} />
          </React.Fragment>
        ))}

        {/* Diagonal cross in center 2x2 */}
        <Line x1={cellSize} y1={cellSize} x2={3 * cellSize} y2={3 * cellSize} stroke={lineColor} strokeWidth={strokeWidth} strokeOpacity={0.3} />
        <Line x1={3 * cellSize} y1={cellSize} x2={cellSize} y2={3 * cellSize} stroke={lineColor} strokeWidth={strokeWidth} strokeOpacity={0.3} />

        {/* House numbers */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
          const pos = housePositions[h - 1];
          return (
            <SvgText
              key={h}
              x={pos.col * cellSize + 10}
              y={pos.row * cellSize + 14}
              fill={textColor}
              fontSize="9"
              fontWeight="600"
            >
              {h}
            </SvgText>
          );
        })}

        {/* Planets in houses */}
        {Object.entries(planetsByHouse).map(([house, pList]) => {
          const center = getHouseCenter(parseInt(house));
          return pList.map((p, idx) => {
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            const ox = (col - 1) * 16;
            const oy = row * 14 - 4;
            return (
              <G key={`${house}-${idx}`}>
                <Circle cx={center.x + ox} cy={center.y + oy - 2} r="10" fill={saffron} fillOpacity={0.12} />
                <SvgText
                  x={center.x + ox}
                  y={center.y + oy + 2}
                  fill={saffron}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {p.label}
                </SvgText>
              </G>
            );
          });
        })}
      </Svg>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '700' },
  headerSubtitle: { fontSize: FontSizes.sm, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tokenBadgeText: { fontSize: FontSizes.sm, fontWeight: '700' },

  // Hero card
  heroCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  heroBadgeText: { fontSize: FontSizes.sm, fontWeight: '600' },
  heroNakshatraIndex: { fontSize: FontSizes.sm, fontWeight: '500' },
  heroContent: { alignItems: 'center', marginBottom: 20 },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
  },
  heroLabel: { fontSize: FontSizes.md, marginBottom: 4 },
  heroName: { fontSize: 28, fontWeight: '800' },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatValue: { fontSize: FontSizes.md, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  heroStatLabel: { fontSize: FontSizes.xs, fontWeight: '500' },
  heroDivider: { width: 1, height: 24 },

  // Chart section
  chartSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: '700' },
  sectionSubtitle: { fontSize: FontSizes.sm, marginTop: 4, marginBottom: 12 },
  sectionSubtitleSmall: { fontSize: FontSizes.sm },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm - 1,
  },
  toggleText: { fontSize: FontSizes.sm, fontWeight: '600' },

  chartCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Planet positions
  planetCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  planetIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planetLabel: { fontSize: FontSizes.sm, fontWeight: '800' },
  planetInfo: { flex: 1 },
  planetName: { fontSize: FontSizes.md, fontWeight: '600' },
  planetDetail: { fontSize: FontSizes.sm, marginTop: 1 },
  planetHouse: { fontSize: FontSizes.md, fontWeight: '700' },

  // Dasha
  dashaCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  dashaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dashaLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  dashaDot: { width: 10, height: 10, borderRadius: 5 },
  dashaPlanet: { fontSize: FontSizes.md, fontWeight: '600' },
  dashaYears: { fontSize: FontSizes.sm, marginTop: 2 },
  dashaProgressContainer: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  dashaProgressBar: { height: '100%', borderRadius: 2 },

  // Dosha
  doshaCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  doshaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  doshaIconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  doshaHeaderInfo: { flex: 1 },
  doshaName: { fontSize: FontSizes.xxl, fontWeight: '700' },
  doshaElement: { fontSize: FontSizes.md, marginTop: 2 },
  doshaTraitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  traitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  traitChipText: { fontSize: FontSizes.sm, fontWeight: '600' },
  doshaTriRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  doshaTriItem: { alignItems: 'center', gap: 6 },
  doshaTriIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  doshaTriName: { fontSize: FontSizes.sm },

  // Nakshatra guide
  nakshatraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.lg,
    marginTop: 28,
    marginBottom: 12,
  },
  nakshatraItem: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: 8,
    overflow: 'hidden',
  },
  nakshatraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  nakshatraNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nakshatraNumText: { fontSize: FontSizes.sm, fontWeight: '700' },
  nakshatraMainInfo: { flex: 1 },
  nakshatraName: { fontSize: FontSizes.md, fontWeight: '600' },
  nakshatraMeaning: { fontSize: FontSizes.sm, marginTop: 2 },
  nakshatraExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 12,
  },
  nakshatraDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nakshatraDetailLabel: { fontSize: FontSizes.sm },
  nakshatraDetailValue: { fontSize: FontSizes.sm, fontWeight: '600' },
  nakshatraQuality: { fontSize: FontSizes.sm, lineHeight: 20, marginTop: 8 },

  // Info cards
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 12,
    marginTop: 24,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.md,
    gap: 10,
    borderWidth: 1,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: { fontSize: FontSizes.lg, fontWeight: '700' },
  infoSubtitle: { fontSize: FontSizes.xs, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: 28,
    paddingTop: 12,
    minHeight: 480,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  modalBody: { alignItems: 'center', width: '100%' },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
  },
  modalTitle: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { fontSize: FontSizes.lg, fontWeight: '600', marginBottom: 24 },
  modalStats: { width: '100%', gap: 10 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: BorderRadius.md,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statLabel: { fontSize: FontSizes.sm, marginBottom: 2 },
  statValue: { fontSize: FontSizes.lg, fontWeight: '700' },
  modalDescription: {
    fontSize: FontSizes.md,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 8,
  },
  modalButton: {
    width: '100%',
    padding: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 24,
  },
  modalButtonText: { color: '#FFFFFF', fontSize: FontSizes.lg, fontWeight: '700' },
});
