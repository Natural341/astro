import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Animated,
  Easing,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowCircleLeftIcon,
  XIcon,
  CheckIcon,
  UserIcon,
  CalendarIcon,
  RefreshIcon,
  MagicStarIcon,
  SparklesIcon,
  InfinityIcon,
} from '../components/icons';
import { NumerologySvgIcon } from '../components/SvgAssetIcons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing } from '../config/theme';

// ─── Chaldean letter values ─────────────────────────────────────
const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, Ç: 3, D: 4, E: 5, F: 6, G: 7, Ğ: 7,
  H: 8, I: 9, İ: 9, J: 1, K: 2, L: 3, M: 4, N: 5, O: 6,
  Ö: 6, P: 7, R: 9, S: 1, Ş: 1, T: 2, U: 3, Ü: 3, V: 4,
  Y: 7, Z: 8,
};

const NUMBER_MEANINGS: Record<number, { title: string; desc: string; traits: string[]; symbol: string }> = {
  1: { title: 'The Leader', desc: 'Independent, original, and determined. You are built for new beginnings and trailblazing. Your energy drives innovation and courage in everything you pursue. Natural-born leaders like you carry a fire within — a relentless spark that ignites progress and inspires those around you to reach higher.', traits: ['Pioneer', 'Independent', 'Ambitious', 'Bold'], symbol: '☉' },
  2: { title: 'The Diplomat', desc: 'Harmonious, gentle, and cooperative. You excel at building balance in relationships. Your intuition guides others toward peace and understanding. The world needs your sensitivity — you sense what others miss and weave connections that hold communities together.', traits: ['Empathetic', 'Balanced', 'Cooperative', 'Gentle'], symbol: '☽' },
  3: { title: 'The Creator', desc: 'Expressive, joyful, and inspiring. You shine in art, communication, and creativity. The world brightens when you share your vision. Your imagination is a wellspring that never runs dry — every conversation, every project you touch becomes something more vibrant and alive.', traits: ['Creative', 'Expressive', 'Optimistic', 'Artistic'], symbol: '△' },
  4: { title: 'The Builder', desc: 'Organized, reliable, and hardworking. You build solid foundations and lasting structures. Your discipline turns dreams into reality. Where others see chaos, you see blueprints — your patience and persistence create legacies that stand the test of time.', traits: ['Reliable', 'Practical', 'Diligent', 'Steady'], symbol: '□' },
  5: { title: 'The Explorer', desc: 'Free-spirited, curious, and adaptable. Change and experience excite you. You thrive where others fear to tread. Your restless soul craves the unknown — each journey, whether physical or intellectual, expands your understanding and enriches your ever-evolving story.', traits: ['Adventurous', 'Flexible', 'Curious', 'Dynamic'], symbol: '☆' },
  6: { title: 'The Nurturer', desc: 'Loving, responsible, and devoted to family. Your caregiving instinct is powerful. You create beauty and harmony wherever you go. Your heart is a sanctuary for those you love — you carry the rare gift of making everyone feel seen, valued, and protected.', traits: ['Caring', 'Responsible', 'Loving', 'Devoted'], symbol: '♡' },
  7: { title: 'The Mystic', desc: 'Deep thinker, intuitive, and analytical. You love unraveling mysteries. Your inner wisdom reveals truths hidden from others. The quiet depths of your mind hold galaxies of insight — you are the seeker who finds meaning where others see only noise.', traits: ['Introspective', 'Intuitive', 'Analytical', 'Wise'], symbol: '⟡' },
  8: { title: 'The Powerhouse', desc: 'Ambitious, determined, and success-driven. Material and spiritual power flows through you. You manifest abundance naturally. Your presence commands respect — the universe responds to your unwavering focus, turning your visions into tangible, lasting achievements.', traits: ['Ambitious', 'Decisive', 'Powerful', 'Magnetic'], symbol: '∞' },
  9: { title: 'The Humanitarian', desc: 'Idealistic, generous, and sees the bigger picture. You yearn to serve humanity. Your compassion transforms the world around you. Yours is the number of completion and wisdom — you carry the lessons of all numbers before you, giving selflessly to uplift the collective spirit.', traits: ['Compassionate', 'Idealistic', 'Generous', 'Visionary'], symbol: '✧' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ACCENT = '#9D4EDD';

// ─── Drum picker constants ──────────────────────────────────────
const DRUM_ITEM_HEIGHT = 48;
const DRUM_VISIBLE = 5;
const DRUM_HEIGHT = DRUM_ITEM_HEIGHT * DRUM_VISIBLE;
const DRUM_PADDING = DRUM_ITEM_HEIGHT * 2; // top/bottom padding so first/last items can center

// ─── Calculation helpers ────────────────────────────────────────
const reduce = (n: number): number => {
  let r = n;
  while (r > 9) {
    let s = 0, t = r;
    while (t > 0) { s += t % 10; t = Math.floor(t / 10); }
    r = s;
  }
  return r;
};

const calcNameNumber = (name: string) => {
  const total = name.toUpperCase().replace(/\s/g, '').split('').reduce((s, c) => s + (LETTER_VALUES[c] || 0), 0);
  return reduce(total);
};

const calcLifePath = (dateStr: string) => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return 1;
  return reduce((parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) + (parseInt(parts[2]) || 0));
};

const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) out += '/';
    out += digits[i];
  }
  return out;
};

// ─── Drum Picker Column (ScrollView based — reliable snap) ──────
const DrumColumn = ({
  data,
  selectedIndex,
  onSelect,
  renderLabel,
  isDark,
}: {
  data: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderLabel: (item: any) => string;
  isDark: boolean;
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const mounted = useRef(false);

  // Scroll to selected on mount
  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: selectedIndex * DRUM_ITEM_HEIGHT,
          animated: false,
        });
        mounted.current = true;
      }, 50);
    }
  }, []);

  const handleScrollEnd = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / DRUM_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, data.length - 1));
    if (clamped !== selectedIndex && mounted.current) {
      Haptics.selectionAsync();
      onSelect(clamped);
    }
    // Snap correction
    scrollRef.current?.scrollTo({ y: clamped * DRUM_ITEM_HEIGHT, animated: true });
  }, [data.length, selectedIndex, onSelect]);

  return (
    <View style={[drumStyles.column, { height: DRUM_HEIGHT }]}>
      {/* Center highlight band — behind the text */}
      <View
        pointerEvents="none"
        style={[
          drumStyles.highlight,
          {
            top: DRUM_PADDING,
            height: DRUM_ITEM_HEIGHT,
            backgroundColor: isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.08)',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: isDark ? 'rgba(157,78,221,0.25)' : 'rgba(157,78,221,0.15)',
          },
        ]}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={DRUM_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: DRUM_PADDING }}
        nestedScrollEnabled
        bounces={false}
        overScrollMode="never"
      >
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <View key={index} style={[drumStyles.item, { height: DRUM_ITEM_HEIGHT }]}>
              <Text
                style={{
                  color: isSelected
                    ? (isDark ? '#FFFFFF' : '#1A1A2E')
                    : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.22)'),
                  fontWeight: isSelected ? '700' : '400',
                  fontSize: isSelected ? 20 : 15,
                }}
              >
                {renderLabel(item)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      {/* Top/bottom fade — pointer events none so scroll works */}
      <View pointerEvents="none" style={[drumStyles.fadeTop, {
        backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
      }]} />
      <View pointerEvents="none" style={[drumStyles.fadeBottom, {
        backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
      }]} />
    </View>
  );
};

// ─── Cosmic Orb Animation ────────────────────────────────────────
const CosmicOrb = ({ isDark }: { isDark: boolean }) => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const coreScale = useRef(new Animated.Value(0.6)).current;
  const coreOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Core appear
    Animated.parallel([
      Animated.spring(coreScale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.timing(coreOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Ripple rings staggered
    const createRipple = (anim: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ).start();
      }, delay);
    };
    createRipple(pulse1, 0);
    createRipple(pulse2, 500);
    createRipple(pulse3, 1000);
  }, []);

  const makeRippleStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: ACCENT,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
  });

  return (
    <View style={styles.orbContainer}>
      <Animated.View style={makeRippleStyle(pulse1)} />
      <Animated.View style={makeRippleStyle(pulse2)} />
      <Animated.View style={makeRippleStyle(pulse3)} />
      <Animated.View style={[styles.orbCore, {
        backgroundColor: ACCENT + '20',
        transform: [{ scale: coreScale }],
        opacity: coreOpacity,
      }]}>
        <MagicStarIcon size={32} color={ACCENT} />
      </Animated.View>
    </View>
  );
};

// ─── Animated Number Card ───────────────────────────────────────
const AnimatedNumberCard = ({
  label,
  num,
  index,
  textColor,
  secondaryText,
  cardBg,
  isDark,
}: {
  label: string;
  num: number;
  index: number;
  textColor: string;
  secondaryText: string;
  cardBg: string;
  isDark: boolean;
}) => {
  const m = NUMBER_MEANINGS[num];
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const [showDesc, setShowDesc] = useState(false);
  const [typedDesc, setTypedDesc] = useState('');
  const traitAnims = useRef(m.traits.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const delay = index * 250 + 400;

    // Card slide + fade
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Ring pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Trait chips stagger
    const traitDelay = delay + 500;
    traitAnims.forEach((a, i) => {
      Animated.spring(a, {
        toValue: 1,
        delay: traitDelay + i * 100,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    });

    // Typewriter
    const typeDelay = delay + 800;
    setTimeout(() => {
      setShowDesc(true);
    }, typeDelay);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!showDesc) return;
    let i = 0;
    const desc = m.desc;
    const interval = setInterval(() => {
      i++;
      setTypedDesc(desc.slice(0, i));
      if (i >= desc.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [showDesc]);

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.12, 0.28, 0.12] });

  return (
    <Animated.View
      style={[
        styles.numCard,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.numCardTop}>
        <View style={styles.numCircleContainer}>
          {/* Glow ring */}
          <Animated.View
            style={[
              styles.numGlowRing,
              {
                borderColor: ACCENT,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          <View style={[styles.numCircle, { backgroundColor: ACCENT + '10' }]}>
            <Text style={[styles.numDigit, { color: ACCENT }]}>{num}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.numLabel, { color: secondaryText }]}>{label}</Text>
          <Text style={[styles.numTitle, { color: textColor }]}>{m.title}</Text>
          <Text style={[styles.numSymbol, { color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }]}>{m.symbol}</Text>
        </View>
      </View>

      {/* Trait chips */}
      <View style={styles.traitRow}>
        {m.traits.map((t, i) => (
          <Animated.View
            key={t}
            style={[
              styles.traitChip,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                opacity: traitAnims[i],
                transform: [{ scale: traitAnims[i] }],
              },
            ]}
          >
            <Text style={[styles.traitText, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)' }]}>{t}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Description (typewriter) */}
      <View style={styles.descContainer}>
        <Text style={[styles.numDesc, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)' }]}>
          {typedDesc}
          {showDesc && typedDesc.length < m.desc.length && (
            <Text style={{ color: ACCENT + '60' }}>|</Text>
          )}
        </Text>
      </View>
    </Animated.View>
  );
};

// ═════════════════════════════════════════════════════════════════
// ─── Main Screen ────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════
export const NumerologyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useStore();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isCalc, setIsCalc] = useState(false);
  const [result, setResult] = useState<{ nameNum: number; lifeNum: number } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [dateFocused, setDateFocused] = useState(false);

  // Date picker drum state
  const [pickerDay, setPickerDay] = useState(15);
  const [pickerMonth, setPickerMonth] = useState(0);
  const [pickerYear, setPickerYear] = useState(2000);

  // Animations
  const formOpacity = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const calcPhaseAnim = useRef(new Animated.Value(0)).current;
  const [showSlots, setShowSlots] = useState(false);

  // Auto-fill from store
  useEffect(() => {
    if (user?.nickname && !name) setName(user.nickname);
    if (user?.birthDate && !birthDate) {
      const raw = user.birthDate.replace(/\D/g, '');
      if (raw.length >= 8) {
        const yr = raw.slice(0, 4), mo = raw.slice(4, 6), dy = raw.slice(6, 8);
        setBirthDate(`${dy}/${mo}/${yr}`);
      }
    }
  }, [user]);

  // Shimmer loop for active button
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const bgColor = colors.background;
  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const inputBg = isDark ? '#1E1E30' : '#F4F4F8';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const canCalculate = name.trim().length > 0 && birthDate.length >= 10;

  const handleDateChange = (raw: string) => {
    setBirthDate(formatDateInput(raw));
  };

  const confirmDatePicker = () => {
    const dy = String(pickerDay + 1).padStart(2, '0');
    const mo = String(pickerMonth + 1).padStart(2, '0');
    setBirthDate(`${dy}/${mo}/${pickerYear}`);
    setShowDatePicker(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const calculate = async () => {
    if (!canCalculate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Phase 1: fade form out, show cosmic orb
    setIsCalc(true);
    setShowSlots(true);

    Animated.timing(formOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(calcPhaseAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Compute results
    const nameNum = calcNameNumber(name);
    const lifeNum = calcLifePath(birthDate);

    // Wait for slot animation
    await new Promise(r => setTimeout(r, 1800));

    setResult({ nameNum, lifeNum });
    setIsCalc(false);
    setShowSlots(false);

    // Phase 2: show results
    Animated.timing(resultOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.timing(calcPhaseAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const resetAnalysis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult(null);
    resultOpacity.setValue(0);
    formOpacity.setValue(1);
    calcPhaseAnim.setValue(0);
  };

  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const dayData = Array.from({ length: daysInMonth }, (_, i) => i);
  const monthData = Array.from({ length: 12 }, (_, i) => i);
  const yearData = Array.from({ length: 100 }, (_, i) => 2010 - i);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  // ── Cosmic connection text ──────────────────────────────────
  const getCosmicConnection = (nameNum: number, lifeNum: number): string => {
    if (nameNum === lifeNum) return 'Your name and life path vibrate in perfect unison — a rare cosmic alignment of identity and destiny. When both numbers match, it means the universe has given you a singular, focused mission. Your outer identity and inner purpose speak the same language, amplifying your power to create meaningful change.';
    const diff = Math.abs(nameNum - lifeNum);
    if (diff <= 2) return 'Your name and life path numbers are closely aligned, suggesting deep harmony between your identity and your soul\'s journey. This closeness means your everyday actions naturally support your higher purpose. You may find that opportunities flow to you with less resistance — the universe recognizes your alignment and rewards it.';
    if (diff >= 5) return 'The contrast between your name and life path creates dynamic tension — a powerful catalyst for growth and transformation. This gap is not a weakness but a gift: it pushes you beyond comfort zones and forces evolution. The greatest breakthroughs in your life will come from bridging these two energies into something neither could achieve alone.';
    return 'Your name number and life path complement each other beautifully, bringing balance between who you appear to be and your deeper purpose. This moderate difference creates a healthy interplay — your public self and your soul\'s calling are distinct enough to keep life interesting, yet close enough to prevent inner conflict. Lean into both energies for a rich, fulfilling life.';
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          >
            <ArrowCircleLeftIcon size={22} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Calculating Phase (Cosmic Orb) ───────────── */}
          {showSlots && (
            <Animated.View style={[styles.slotContainer, { opacity: calcPhaseAnim }]}>
              <CosmicOrb isDark={isDark} />
              <Text style={[styles.slotTitle, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                Reading your cosmic vibrations...
              </Text>
            </Animated.View>
          )}

          {/* ── Form (centered) ────────────────────────────── */}
          {!result && !showSlots && (
            <Animated.View style={[styles.formGroup, { opacity: formOpacity }]}>
              {/* Centered icon + subtitle */}
              <View style={styles.formHeader}>
                <NumerologySvgIcon size={48} color={ACCENT} />
                <Text style={[styles.formTitle, { color: textColor }]}>{t('nameAnalysis')}</Text>
                <Text style={[styles.formSubtitle, { color: secondaryText }]}>
                  Discover the hidden meaning behind your name and birth date
                </Text>
              </View>

              {/* Name input */}
              <View>
                <Text style={[styles.fieldLabel, { color: secondaryText }]}>{t('fullName')}</Text>
                <View
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: inputBg,
                      borderColor: nameFocused ? ACCENT + '50' : borderColor,
                      borderWidth: nameFocused ? 1.5 : 1,
                    },
                  ]}
                >
                  <UserIcon size={18} color={nameFocused ? ACCENT : secondaryText} />
                  <TextInput
                    style={[styles.inputText, { color: textColor }]}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('yourFullName')}
                    placeholderTextColor={secondaryText}
                    autoCapitalize="words"
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                  {name.length > 0 && (
                    <TouchableOpacity onPress={() => setName('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <XIcon size={16} color={secondaryText} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Birth date — single calendar icon, tappable */}
              <View>
                <Text style={[styles.fieldLabel, { color: secondaryText }]}>{t('birthDate')}</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: inputBg,
                      borderColor: birthDate.length > 0 ? ACCENT + '40' : borderColor,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <CalendarIcon size={18} color={birthDate.length > 0 ? ACCENT : secondaryText} />
                  <Text style={[styles.inputText, { color: birthDate.length > 0 ? textColor : secondaryText }]}>
                    {birthDate.length > 0 ? birthDate : 'Select your birth date'}
                  </Text>
                </TouchableOpacity>
                {user?.birthDate && !birthDate && (
                  <TouchableOpacity
                    onPress={() => {
                      const raw = user.birthDate!.replace(/\D/g, '');
                      if (raw.length >= 8) {
                        const yr = raw.slice(0, 4), mo = raw.slice(4, 6), dy = raw.slice(6, 8);
                        setBirthDate(`${dy}/${mo}/${yr}`);
                      }
                    }}
                    style={styles.autoFillHint}
                  >
                    <RefreshIcon size={12} color={ACCENT} />
                    <Text style={[styles.autoFillText, { color: ACCENT }]}>{t('useSavedBirthDate')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Calculate button with shimmer */}
              <TouchableOpacity
                style={[
                  styles.calcBtn,
                  {
                    backgroundColor: canCalculate ? ACCENT : (isDark ? '#1E1E32' : '#EBEBEB'),
                    overflow: 'hidden',
                  },
                ]}
                onPress={calculate}
                disabled={!canCalculate || isCalc}
                activeOpacity={0.8}
              >
                {canCalculate && (
                  <Animated.View
                    style={[
                      styles.shimmer,
                      {
                        transform: [{ translateX: shimmerTranslate }],
                      },
                    ]}
                  />
                )}
                <Text style={[styles.calcBtnText, { color: canCalculate ? '#FFF' : secondaryText }]}>
                  {t('calculate')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Results ────────────────────────────────────── */}
          {result && !showSlots && (
            <Animated.View style={[{ gap: 16 }, { opacity: resultOpacity }]}>
              {/* User summary — centered & prominent */}
              <View style={[styles.summaryCard, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }]}>
                <View style={[styles.summaryAvatar, { backgroundColor: ACCENT + '15' }]}>
                  <Text style={[styles.summaryAvatarText, { color: ACCENT }]}>
                    {name.trim()[0]?.toUpperCase() || 'N'}
                  </Text>
                </View>
                <Text style={[styles.summaryName, { color: textColor }]}>{name}</Text>
                <Text style={[styles.summaryDate, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)' }]}>{birthDate}</Text>
              </View>

              <AnimatedNumberCard
                label={t('nameNumber')}
                num={result.nameNum}
                index={0}
                textColor={textColor}
                secondaryText={secondaryText}
                cardBg={cardBg}
                isDark={isDark}
              />

              <AnimatedNumberCard
                label={t('lifePathNumber')}
                num={result.lifeNum}
                index={1}
                textColor={textColor}
                secondaryText={secondaryText}
                cardBg={cardBg}
                isDark={isDark}
              />

              {/* Cosmic Connection */}
              <View style={[styles.connectionCard, {
                backgroundColor: isDark ? 'rgba(157,78,221,0.08)' : 'rgba(157,78,221,0.05)',
                borderColor: isDark ? 'rgba(157,78,221,0.18)' : 'rgba(157,78,221,0.12)',
              }]}>
                <View style={styles.connectionHeader}>
                  <InfinityIcon size={18} color={ACCENT} />
                  <Text style={[styles.connectionTitle, { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)' }]}>{t('cosmicConnection')}</Text>
                </View>
                <View style={[styles.connectionDivider, { backgroundColor: ACCENT + '20' }]} />
                <Text style={[styles.connectionDesc, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
                  {getCosmicConnection(result.nameNum, result.lifeNum)}
                </Text>
              </View>

              {/* Reset */}
              <TouchableOpacity
                style={[styles.resetBtn, {
                  backgroundColor: ACCENT,
                }]}
                onPress={resetAnalysis}
                activeOpacity={0.8}
              >
                <NumerologySvgIcon size={20} color="#FFF" />
                <Text style={[styles.resetBtnText, { color: '#FFF' }]}>{t('newAnalysis')}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── Date Picker Modal (Drum Roller) ────────────── */}
        <Modal visible={showDatePicker} transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.modalSheet, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}
            >
              {/* Handle bar */}
              <View style={styles.modalHandle}>
                <View style={[styles.handleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>{t('selectDate')}</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <XIcon size={20} color={secondaryText} />
                </TouchableOpacity>
              </View>

              {/* Drum pickers */}
              <View style={styles.drumRow}>
                <View style={styles.drumColWrap}>
                  <Text style={[styles.drumLabel, { color: secondaryText }]}>{t('dayLabel')}</Text>
                  <DrumColumn
                    data={dayData}
                    selectedIndex={pickerDay}
                    onSelect={setPickerDay}
                    renderLabel={(i: number) => String(i + 1).padStart(2, '0')}
                    isDark={isDark}
                  />
                </View>
                <View style={styles.drumColWrap}>
                  <Text style={[styles.drumLabel, { color: secondaryText }]}>{t('monthLabel')}</Text>
                  <DrumColumn
                    data={monthData}
                    selectedIndex={pickerMonth}
                    onSelect={setPickerMonth}
                    renderLabel={(i: number) => MONTHS[i]}
                    isDark={isDark}
                  />
                </View>
                <View style={styles.drumColWrap}>
                  <Text style={[styles.drumLabel, { color: secondaryText }]}>{t('yearLabel')}</Text>
                  <DrumColumn
                    data={yearData}
                    selectedIndex={yearData.indexOf(pickerYear) >= 0 ? yearData.indexOf(pickerYear) : 10}
                    onSelect={(idx: number) => setPickerYear(yearData[idx])}
                    renderLabel={(y: number) => String(y)}
                    isDark={isDark}
                  />
                </View>
              </View>

              {/* Selected preview */}
              <View style={[styles.selectedPreview, {
                backgroundColor: isDark ? 'rgba(157,78,221,0.1)' : 'rgba(157,78,221,0.06)',
                borderColor: isDark ? 'rgba(157,78,221,0.2)' : 'rgba(157,78,221,0.12)',
              }]}>
                <Text style={[styles.selectedPreviewText, { color: isDark ? '#FFFFFF' : '#1A1A2E' }]}>
                  {String(pickerDay + 1).padStart(2, '0')} {MONTHS[pickerMonth]} {pickerYear}
                </Text>
              </View>

              {/* Confirm */}
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: ACCENT }]}
                onPress={confirmDatePicker}
                activeOpacity={0.8}
              >
                <CheckIcon size={18} color="#FFF" />
                <Text style={styles.confirmBtnText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

// ─── Drum Picker Styles ─────────────────────────────────────────
const drumStyles = StyleSheet.create({
  column: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: DRUM_ITEM_HEIGHT * 1.8,
    opacity: 0.92,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DRUM_ITEM_HEIGHT * 1.8,
    opacity: 0.92,
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 10,
  },
});

// ─── Main Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: { padding: Spacing.lg },

  // ── Form ──
  formGroup: { gap: 20 },
  formHeader: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingTop: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  formSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputText: { flex: 1, fontSize: 16 },
  autoFillHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  autoFillText: { fontSize: 12, fontWeight: '600' },

  calcBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  calcBtnText: { fontSize: 17, fontWeight: '700' },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ skewX: '-20deg' }],
  },

  // ── Cosmic Orb ──
  slotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 32,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  orbContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Summary ──
  summaryCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  summaryAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryAvatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryName: { fontSize: 20, fontWeight: '700' },
  summaryDate: { fontSize: 14 },

  // ── Number Card ──
  numCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  numCardTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  numCircleContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numGlowRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },
  numCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numDigit: { fontSize: 30, fontWeight: '900' },
  numLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  numTitle: { fontSize: 19, fontWeight: '700' },
  numSymbol: { fontSize: 16, marginTop: 2 },
  traitRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  traitChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  traitText: { fontSize: 12, fontWeight: '600' },
  descContainer: {
    minHeight: 60,
  },
  numDesc: { fontSize: 14, lineHeight: 22 },

  // ── Cosmic Connection ──
  connectionCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  connectionDivider: {
    height: 1,
    borderRadius: 1,
  },
  connectionDesc: {
    fontSize: 14,
    lineHeight: 22,
  },

  // ── Reset ──
  resetBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  resetBtnText: { fontSize: 16, fontWeight: '700' },

  // ── Date Picker Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 36,
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },

  drumRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  drumColWrap: {
    flex: 1,
    alignItems: 'center',
  },
  drumLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  selectedPreview: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },
  selectedPreviewText: { fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  confirmBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
