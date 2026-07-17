// Draw Soulmate Screen — Cosmic text portrait via Gemini AI
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Easing,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MagicStarIcon, TickCircleIcon } from '../components/icons';
import { ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { generateSoulmateImage, generateSoulmatePortraitImage, SoulmateParams } from '../services/geminiService';
import { tracker } from '../services/eventTracker';
import { Spacing, BorderRadius, FontSizes } from '../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SOULMATE_TOKEN_COST = 30;

type Gender = 'any' | 'male' | 'female';

const DRAWING_STAGES = [
  'Reading the stars...',
  'Mapping celestial alignments...',
  'Sketching features...',
  'Adding cosmic details...',
  'Finalizing portrait...',
];

// Zodiac element mapping
const ZODIAC_ELEMENTS: Record<string, { element: string; planet: string }> = {
  Aries:       { element: 'Fire',  planet: 'Mars' },
  Taurus:      { element: 'Earth', planet: 'Venus' },
  Gemini:      { element: 'Air',   planet: 'Mercury' },
  Cancer:      { element: 'Water', planet: 'Moon' },
  Leo:         { element: 'Fire',  planet: 'Sun' },
  Virgo:       { element: 'Earth', planet: 'Mercury' },
  Libra:       { element: 'Air',   planet: 'Venus' },
  Scorpio:     { element: 'Water', planet: 'Pluto' },
  Sagittarius: { element: 'Fire',  planet: 'Jupiter' },
  Capricorn:   { element: 'Earth', planet: 'Saturn' },
  Aquarius:    { element: 'Air',   planet: 'Uranus' },
  Pisces:      { element: 'Water', planet: 'Neptune' },
};

// ─── Derive zodiac sign from DD.MM.YYYY ──────────────────────────────────────
const deriveZodiac = (date: string): string => {
  const [dd, mm] = date.split('.').map(Number);
  if (!dd || !mm) return '';
  if ((mm === 3 && dd >= 21) || (mm === 4 && dd <= 19)) return 'Aries';
  if ((mm === 4 && dd >= 20) || (mm === 5 && dd <= 20)) return 'Taurus';
  if ((mm === 5 && dd >= 21) || (mm === 6 && dd <= 20)) return 'Gemini';
  if ((mm === 6 && dd >= 21) || (mm === 7 && dd <= 22)) return 'Cancer';
  if ((mm === 7 && dd >= 23) || (mm === 8 && dd <= 22)) return 'Leo';
  if ((mm === 8 && dd >= 23) || (mm === 9 && dd <= 22)) return 'Virgo';
  if ((mm === 9 && dd >= 23) || (mm === 10 && dd <= 22)) return 'Libra';
  if ((mm === 10 && dd >= 23) || (mm === 11 && dd <= 21)) return 'Scorpio';
  if ((mm === 11 && dd >= 22) || (mm === 12 && dd <= 21)) return 'Sagittarius';
  if ((mm === 12 && dd >= 22) || (mm === 1 && dd <= 19)) return 'Capricorn';
  if ((mm === 1 && dd >= 20) || (mm === 2 && dd <= 18)) return 'Aquarius';
  return 'Pisces';
};

// ─── Parse sections from AI response ─────────────────────────────────────────
interface PortraitSections {
  physical: string;
  personality: string;
  meeting: string;
  compatibility: number;
  raw: string;
}

const parsePortraitSections = (text: string): PortraitSections => {
  const sections: PortraitSections = {
    physical: '',
    personality: '',
    meeting: '',
    compatibility: Math.floor(Math.random() * 16) + 80, // 80-95%
    raw: text,
  };

  // Try to split by section headers the AI was asked to produce
  const physicalMatch = text.match(/\*?\*?Physical Traits\*?\*?[:\s]*([\s\S]*?)(?=\*?\*?Personality|$)/i);
  const personalityMatch = text.match(/\*?\*?Personality\*?\*?[:\s]*([\s\S]*?)(?=\*?\*?Where You|$)/i);
  const meetingMatch = text.match(/\*?\*?Where You Might Meet\*?\*?[:\s]*([\s\S]*?)(?=\*?\*?Compatibility|$)/i);
  const compatMatch = text.match(/\*?\*?Compatibility\*?\*?[:\s]*(\d+)/i);

  if (physicalMatch) sections.physical = physicalMatch[1].trim();
  if (personalityMatch) sections.personality = personalityMatch[1].trim();
  if (meetingMatch) sections.meeting = meetingMatch[1].trim();
  if (compatMatch) sections.compatibility = parseInt(compatMatch[1], 10);

  // If parsing failed, use entire text as physical
  if (!sections.physical && !sections.personality) {
    sections.physical = text;
  }

  return sections;
};

export const DrawSoulmateScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, accent } = useTheme();
  const { t } = useTranslation();
  const DRAWING_STAGES_T = [
    t('soulmateProgress1'), t('soulmateProgress2'), t('soulmateProgress3'),
    t('soulmateProgress4'), t('soulmateProgress5'),
  ];
  const ACCENT = accent.purple;
  const { user, removeTokens, addTokens } = useStore();

  const [step, setStep] = useState<'input' | 'drawing' | 'result'>('input');

  // Form state
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthCity, setBirthCity] = useState('');
  const [soulmateGender, setSoulmateGender] = useState<Gender>('any');
  const [usingProfileData, setUsingProfileData] = useState(false);

  // Result state
  const [portrait, setPortrait] = useState<PortraitSections | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [zodiacSign, setZodiacSign] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [imageRetrying, setImageRetrying] = useState(false);
  const lastParamsRef = useRef<SoulmateParams | null>(null);
  const imageRetryCountRef = useRef(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const brushXAnim = useRef(new Animated.Value(0)).current;
  const [drawingStageIdx, setDrawingStageIdx] = useState(0);

  // ─── Track screen view ────────────────────────────────────────────────────
  useEffect(() => {
    tracker.track('screen_view', { screen: 'DrawSoulmate' });
  }, []);

  // ─── Auto-fill from profile ───────────────────────────────────────────────
  const hasProfileData = !!user?.birthDate || !!user?.birthCity;

  const fillFromProfile = useCallback(() => {
    setBirthDate(user?.birthDate ?? '');
    setBirthTime(user?.birthTime ?? '');
    setBirthCity(user?.birthCity ?? '');
    setUsingProfileData(true);
  }, [user]);

  useEffect(() => {
    if (hasProfileData) fillFromProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Input formatters ─────────────────────────────────────────────────────
  const handleDateChange = (text: string) => {
    let n = text.replace(/\D/g, '').slice(0, 8);
    if (n.length > 4) n = `${n.slice(0, 2)}.${n.slice(2, 4)}.${n.slice(4)}`;
    else if (n.length > 2) n = `${n.slice(0, 2)}.${n.slice(2)}`;
    setBirthDate(n);
    setUsingProfileData(false);
  };

  const handleTimeChange = (text: string) => {
    let n = text.replace(/\D/g, '').slice(0, 4);
    if (n.length > 2) n = `${n.slice(0, 2)}:${n.slice(2)}`;
    setBirthTime(n);
    setUsingProfileData(false);
  };

  const handleCityChange = (text: string) => {
    setBirthCity(text);
    setUsingProfileData(false);
  };

  // ─── Pulse animation loop ────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // ─── Brush sweep animation during drawing ─────────────────────────────────
  useEffect(() => {
    if (step !== 'drawing') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(brushXAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(brushXAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [step, brushXAnim]);

  // ─── Drawing progress animation ──────────────────────────────────────────
  const startProgressAnimation = () => {
    progressAnim.setValue(0);
    setDrawingStageIdx(0);

    const animateStage = (toVal: number, dur: number, idx: number) =>
      new Promise<void>(resolve => {
        setDrawingStageIdx(idx);
        Animated.timing(progressAnim, {
          toValue: toVal,
          duration: dur,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start(() => resolve());
      });

    (async () => {
      await animateStage(0.15, 1000, 0);
      await animateStage(0.35, 1200, 1);
      await animateStage(0.55, 1500, 2);
      await animateStage(0.75, 1200, 3);
      await animateStage(0.90, 1000, 4);
    })();
  };

  // ─── Start generation ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!isFormValid) return;

    const tokenOk = removeTokens(SOULMATE_TOKEN_COST);
    if (!tokenOk) {
      Alert.alert(
        'Insufficient Tokens',
        `You need ${SOULMATE_TOKEN_COST} Moon Tokens to generate your soulmate portrait. Visit the Premium screen to get more.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tracker.track('feature_tap', { feature: 'draw_soulmate' });

    setStep('drawing');
    setErrorMsg('');
    startProgressAnimation();

    try {
      const sign = user?.zodiacSign ?? deriveZodiac(birthDate);
      setZodiacSign(sign);

      const params: SoulmateParams = {
        birthDate,
        birthTime: birthTime || undefined,
        birthCity: birthCity || undefined,
        zodiacSign: sign || undefined,
        soulmateGender,
      };
      lastParamsRef.current = params;
      imageRetryCountRef.current = 0;

      const result = await generateSoulmateImage(params);

      // Finish progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          const sections = parsePortraitSections(result.description);
          setPortrait(sections);
          setImageUri(result.imageUri || null);
          setImageLoading(!!result.imageUri);
          setStep('result');
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          tracker.track('feature_complete', { feature: 'draw_soulmate' });
        }, 400);
      });
    } catch (err: any) {
      if (__DEV__) console.error('[DrawSoulmate]', err);
      addTokens(SOULMATE_TOKEN_COST);
      setErrorMsg(err?.message ?? 'Portrait generation failed. Please try again.');
      setStep('input');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      tracker.track('feature_error', { feature: 'draw_soulmate', error: err?.message });
    }
  };

  // Retries ONLY the portrait image — the reading already succeeded and its
  // tokens were already spent, so this must never charge tokens again.
  const handleRetryImage = async () => {
    if (!lastParamsRef.current || imageRetrying) return;
    setImageRetrying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    imageRetryCountRef.current += 1;
    try {
      const uri = await generateSoulmatePortraitImage(lastParamsRef.current, imageRetryCountRef.current);
      if (uri) {
        setImageUri(uri);
        setImageLoading(true);
      } else {
        Alert.alert('Still unavailable', 'The sketch service is still busy. Please try again in a moment.');
      }
    } finally {
      setImageRetrying(false);
    }
  };

  const reset = () => {
    lastParamsRef.current = null;
    imageRetryCountRef.current = 0;
    setStep('input');
    setPortrait(null);
    setImageUri(null);
    setZodiacSign('');
    setErrorMsg('');
    progressAnim.setValue(0);
    fadeAnim.setValue(0);
    if (hasProfileData) fillFromProfile();
  };

  const isFormValid = birthDate.length === 10 && birthCity.trim().length >= 2;

  const currentSign = zodiacSign || user?.zodiacSign || deriveZodiac(birthDate);
  const elementInfo = currentSign ? ZODIAC_ELEMENTS[currentSign] : null;

  // ─── Styles ───────────────────────────────────────────────────────────────
  const s = makeStyles(colors, isDark, ACCENT);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowCircleLeftIcon size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('drawSoulmate')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          scrollEnabled={step !== 'drawing'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 1: INPUT ── */}
          {step === 'input' && (
            <View style={s.inputContainer}>
              {/* User avatar → mystery soulmate */}
              <View style={s.avatarRow}>
                <Animated.View style={[s.avatarGlow, {
                  opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
                }]}>
                  {user?.profileImageUrl ? (
                    <Image source={{ uri: user.profileImageUrl }} style={s.avatarImg} />
                  ) : (
                    <View style={[s.avatarFallback, { backgroundColor: ACCENT }]}>
                      <Text style={s.avatarFallbackText}>
                        {user?.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                </Animated.View>

                <View style={s.avatarArrow}>
                  <Ionicons name="heart" size={14} color={ACCENT} />
                </View>

                <Animated.View style={[s.mysteryCircle, {
                  opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                }]}>
                  <Ionicons name="help" size={28} color={ACCENT} />
                </Animated.View>
              </View>

              <Text style={[s.title, { color: colors.text }]}>{t('revealSoulmate')}</Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                {t('soulmateSubtitle')}
              </Text>

              {/* Profile data banner */}
              {hasProfileData && (
                <View style={[s.profileBanner, { backgroundColor: isDark ? colors.card : colors.surface }]}>
                  <TickCircleIcon size={18} color={ACCENT} />
                  <Text style={[s.profileBannerText, { color: colors.textSecondary }]}>
                    {usingProfileData ? t('usingProfileData') : t('profileDataAvailable')}
                  </Text>
                  {!usingProfileData && (
                    <TouchableOpacity onPress={fillFromProfile} style={[s.profileBannerBtn, { backgroundColor: ACCENT }]}>
                      <Text style={s.profileBannerBtnText}>{t('useMyData')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Error */}
              {!!errorMsg && (
                <View style={s.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={[s.errorText, { color: colors.error }]}>{errorMsg}</Text>
                </View>
              )}

              {/* Form */}
              <View style={s.form}>
                {/* Date + Time row */}
                <View style={s.row}>
                  <View style={[s.fieldWrap, { flex: 1 }]}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>{t('birthDate')} *</Text>
                    <TextInput
                      style={[s.input, {
                        backgroundColor: isDark ? colors.card : colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      }]}
                      placeholder="DD.MM.YYYY"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      maxLength={10}
                      value={birthDate}
                      onChangeText={handleDateChange}
                    />
                  </View>
                  <View style={[s.fieldWrap, { width: 110, marginLeft: 12 }]}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>{t('birthTime')}</Text>
                    <TextInput
                      style={[s.input, {
                        backgroundColor: isDark ? colors.card : colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      }]}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      maxLength={5}
                      value={birthTime}
                      onChangeText={handleTimeChange}
                    />
                  </View>
                </View>

                {/* City */}
                <View style={s.fieldWrap}>
                  <Text style={[s.label, { color: colors.textSecondary }]}>{t('birthCity')} *</Text>
                  <TextInput
                    style={[s.input, {
                      backgroundColor: isDark ? colors.card : colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    placeholder="Istanbul"
                    placeholderTextColor={colors.textTertiary}
                    value={birthCity}
                    onChangeText={handleCityChange}
                    autoCapitalize="words"
                  />
                </View>

                {/* Gender preference */}
                <View style={s.fieldWrap}>
                  <Text style={[s.label, { color: colors.textSecondary }]}>{t('lookingFor')}</Text>
                  <View style={s.genderRow}>
                    {(['female', 'male', 'any'] as Gender[]).map(g => {
                      const isActive = soulmateGender === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[
                            s.genderChip,
                            { backgroundColor: isDark ? colors.card : colors.surface, borderColor: colors.border },
                            isActive && { borderColor: ACCENT, backgroundColor: isDark ? colors.surfaceVariant : colors.surfaceVariant },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSoulmateGender(g);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={g === 'female' ? 'female' : g === 'male' ? 'male' : 'infinite'}
                            size={16}
                            color={isActive ? ACCENT : colors.textTertiary}
                          />
                          <Text style={[
                            s.genderChipText,
                            { color: isActive ? ACCENT : colors.textSecondary },
                            isActive && { fontWeight: '700' as const },
                          ]}>
                            {g === 'any' ? t('genderAny') : g === 'female' ? t('genderFemale') : t('genderMale')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Token cost info */}
              <View style={s.costRow}>
                <Ionicons name="diamond-outline" size={15} color={ACCENT} />
                <Text style={[s.costText, { color: ACCENT }]}>{SOULMATE_TOKEN_COST} {t('moonTokens')}</Text>
                <Text style={[s.costBalance, { color: colors.textSecondary }]}>  |  {t('balance')}: {user?.tokens ?? 0}</Text>
              </View>

              {/* Generate button */}
              <TouchableOpacity
                style={[
                  s.generateBtn,
                  { backgroundColor: ACCENT },
                  !isFormValid && { backgroundColor: isDark ? colors.card : colors.border, elevation: 0 },
                ]}
                onPress={handleGenerate}
                disabled={!isFormValid}
                activeOpacity={0.85}
              >
                <MagicStarIcon size={20} color="#FFF" />
                <Text style={s.generateBtnText}>{t('generatePortrait')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: DRAWING ANIMATION ── */}
          {step === 'drawing' && (
            <View style={s.drawingContainer}>
              {/* Canvas */}
              <View style={[s.canvasBox, {
                backgroundColor: isDark ? colors.card : colors.surface,
                borderColor: isDark ? colors.border : colors.divider,
              }]}>
                {/* Pulsing silhouette */}
                <Animated.View style={[s.silhouettePlaceholder, {
                  opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
                }]}>
                  <Ionicons name="person-outline" size={80} color={ACCENT} />
                </Animated.View>

                {/* Animated brush stroke */}
                <Animated.View style={[s.brushWrap, {
                  transform: [{
                    translateX: brushXAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-SCREEN_WIDTH * 0.18, SCREEN_WIDTH * 0.18],
                    }),
                  }, {
                    rotate: brushXAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: ['-12deg', '0deg', '12deg'],
                    }),
                  }],
                }]}>
                  <Ionicons name="brush" size={32} color={ACCENT} />
                </Animated.View>

                {/* Progress fill overlay */}
                <Animated.View style={[s.canvasReveal, {
                  backgroundColor: isDark
                    ? 'rgba(157,78,221,0.06)'
                    : 'rgba(157,78,221,0.04)',
                  height: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'] as any,
                  }),
                }]} />
              </View>

              {/* Stage message */}
              <Text style={[s.drawingMsg, { color: colors.textSecondary }]}>
                {DRAWING_STAGES_T[drawingStageIdx] ?? DRAWING_STAGES_T[DRAWING_STAGES_T.length - 1]}
              </Text>

              {/* Progress bar */}
              <View style={[s.progressTrack, { backgroundColor: isDark ? colors.surfaceVariant : colors.divider }]}>
                <Animated.View style={[s.progressFill, {
                  backgroundColor: ACCENT,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'] as any,
                  }),
                }]} />
              </View>

              <ActivityIndicator style={{ marginTop: 20 }} color={ACCENT} />
            </View>
          )}

          {/* ── STEP 3: RESULTS ── */}
          {step === 'result' && portrait && (
            <Animated.View style={[s.resultContainer, { opacity: fadeAnim }]}>
              <Text style={[s.resultTitle, { color: colors.text }]}>{t('yourSoulmate')}</Text>
              <Text style={[s.resultSubtitle, { color: colors.textSecondary }]}>
                {t('cosmicPortraitSubtitle')}
              </Text>

              {/* Generated sketch */}
              {imageUri ? (
                <View style={[s.portraitImageWrap, { borderColor: isDark ? colors.border : colors.divider, backgroundColor: isDark ? colors.card : colors.surface }]}>
                  <Image
                    source={{ uri: imageUri }}
                    style={s.portraitImage}
                    resizeMode="cover"
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <View style={s.portraitLoading}>
                      <ActivityIndicator color={ACCENT} />
                      <Text style={[s.pillText, { color: colors.textSecondary, marginTop: 8 }]}>{t('sketching')}</Text>
                    </View>
                  )}
                </View>
              ) : (
                // The free sketch service was unresponsive after several
                // retries — the reading itself still succeeded (below), only
                // the portrait image is missing this time.
                <View style={[s.portraitImageWrap, { borderColor: isDark ? colors.border : colors.divider, backgroundColor: isDark ? colors.card : colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                  {imageRetrying ? (
                    <ActivityIndicator color={ACCENT} />
                  ) : (
                    <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                  )}
                  <Text style={[s.pillText, { color: colors.textSecondary, marginTop: 10, textAlign: 'center', paddingHorizontal: 16 }]}>
                    The portrait sketch couldn't be drawn this time
                  </Text>
                  <TouchableOpacity onPress={handleRetryImage} disabled={imageRetrying} style={{ marginTop: 10 }}>
                    <Text style={[s.pillText, { color: ACCENT, fontWeight: '700' }]}>
                      {imageRetrying ? 'Retrying...' : 'Try drawing again'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Info pills: zodiac, element, planet */}
              <View style={s.pillRow}>
                {currentSign ? (
                  <View style={[s.pill, { backgroundColor: isDark ? colors.card : colors.surface }]}>
                    <Ionicons name="star" size={13} color={ACCENT} />
                    <Text style={[s.pillText, { color: ACCENT }]}>{currentSign}</Text>
                  </View>
                ) : null}
                {elementInfo ? (
                  <View style={[s.pill, { backgroundColor: isDark ? colors.card : colors.surface }]}>
                    <Ionicons
                      name={
                        elementInfo.element === 'Fire' ? 'flame' :
                        elementInfo.element === 'Earth' ? 'leaf' :
                        elementInfo.element === 'Air' ? 'cloud' : 'water'
                      }
                      size={13}
                      color={ACCENT}
                    />
                    <Text style={[s.pillText, { color: ACCENT }]}>{elementInfo.element}</Text>
                  </View>
                ) : null}
                {elementInfo ? (
                  <View style={[s.pill, { backgroundColor: isDark ? colors.card : colors.surface }]}>
                    <Ionicons name="planet" size={13} color={ACCENT} />
                    <Text style={[s.pillText, { color: ACCENT }]}>{elementInfo.planet}</Text>
                  </View>
                ) : null}
              </View>

              {/* Cosmic Portrait Scroll Card */}
              <View style={[s.scrollCard, {
                backgroundColor: isDark ? colors.card : colors.surface,
                borderColor: isDark ? colors.border : colors.divider,
              }]}>
                {/* Top ornament */}
                <View style={s.scrollOrnament}>
                  <View style={[s.scrollLine, { backgroundColor: isDark ? colors.border : colors.divider }]} />
                  <MagicStarIcon size={18} color={ACCENT} />
                  <View style={[s.scrollLine, { backgroundColor: isDark ? colors.border : colors.divider }]} />
                </View>

                <Text style={[s.scrollSectionLabel, { color: ACCENT }]}>{t('cosmicPortrait')}</Text>

                {/* Physical Traits */}
                {!!portrait.physical && (
                  <View style={s.scrollSection}>
                    <View style={s.sectionHeader}>
                      <Ionicons name="eye-outline" size={16} color={ACCENT} />
                      <Text style={[s.sectionHeaderText, { color: colors.text }]}>{t('physicalTraits')}</Text>
                    </View>
                    <Text style={[s.scrollText, { color: colors.textSecondary }]}>{portrait.physical}</Text>
                  </View>
                )}

                {/* Personality */}
                {!!portrait.personality && (
                  <View style={s.scrollSection}>
                    <View style={s.sectionHeader}>
                      <Ionicons name="heart-outline" size={16} color={ACCENT} />
                      <Text style={[s.sectionHeaderText, { color: colors.text }]}>{t('personalityLabel')}</Text>
                    </View>
                    <Text style={[s.scrollText, { color: colors.textSecondary }]}>{portrait.personality}</Text>
                  </View>
                )}

                {/* Where You Might Meet */}
                {!!portrait.meeting && (
                  <View style={s.scrollSection}>
                    <View style={s.sectionHeader}>
                      <Ionicons name="location-outline" size={16} color={ACCENT} />
                      <Text style={[s.sectionHeaderText, { color: colors.text }]}>{t('whereYouMeet')}</Text>
                    </View>
                    <Text style={[s.scrollText, { color: colors.textSecondary }]}>{portrait.meeting}</Text>
                  </View>
                )}

                {/* If parsing failed, show raw text */}
                {!portrait.physical && !portrait.personality && (
                  <Text style={[s.scrollText, { color: colors.textSecondary }]}>{portrait.raw}</Text>
                )}

                {/* Compatibility */}
                <View style={s.compatRow}>
                  <Text style={[s.compatLabel, { color: colors.textTertiary }]}>{t('cosmicCompatibility')}</Text>
                  <View style={[s.compatBarTrack, { backgroundColor: isDark ? colors.surfaceVariant : colors.divider }]}>
                    <View style={[s.compatBarFill, { backgroundColor: ACCENT, width: `${portrait.compatibility}%` }]} />
                  </View>
                  <Text style={[s.compatValue, { color: ACCENT }]}>{portrait.compatibility}%</Text>
                </View>

                {/* Bottom ornament */}
                <View style={s.scrollOrnament}>
                  <View style={[s.scrollLine, { backgroundColor: isDark ? colors.border : colors.divider }]} />
                  <Ionicons name="moon" size={14} color={ACCENT} />
                  <View style={[s.scrollLine, { backgroundColor: isDark ? colors.border : colors.divider }]} />
                </View>

                <Text style={[s.watermarkText, { color: colors.textTertiary }]}>Kosmos Astro AI</Text>
              </View>

              {/* Action buttons */}
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: ACCENT }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    tracker.track('feature_tap', { feature: 'draw_soulmate_save' });
                    Alert.alert('Saved', 'Your cosmic portrait has been saved.');
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bookmark-outline" size={18} color="#FFF" />
                  <Text style={s.actionBtnText}>{t('save')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.actionBtnOutline, { borderColor: ACCENT }]}
                  onPress={reset}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={18} color={ACCENT} />
                  <Text style={[s.actionBtnOutlineText, { color: ACCENT }]}>{t('tryAgain')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles factory ─────────────────────────────────────────────────────────
const makeStyles = (colors: any, isDark: boolean, ACCENT: string) =>
  StyleSheet.create({
    root: { flex: 1 },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.sm,
      backgroundColor: isDark ? colors.card : colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: FontSizes.xl,
      fontWeight: '700',
    },
    scroll: { flexGrow: 1 },

    // ── Input step ──────────────────────────────────────────────────────────
    inputContainer: { padding: Spacing.lg, alignItems: 'center' },

    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 8,
      gap: 12,
    },
    avatarGlow: {},
    avatarImg: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2,
      borderColor: ACCENT,
    },
    avatarFallback: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarFallbackText: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFF',
    },
    avatarArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? colors.card : colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mysteryCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? colors.card : colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: ACCENT,
      borderStyle: 'dashed',
    },

    title: {
      fontSize: FontSizes.xxxl,
      fontWeight: '800',
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: FontSizes.md,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },

    // Profile banner
    profileBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
      gap: 8,
    },
    profileBannerText: {
      flex: 1,
      fontSize: FontSizes.sm,
    },
    profileBannerBtn: {
      borderRadius: BorderRadius.sm,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    profileBannerBtnText: {
      fontSize: FontSizes.sm,
      fontWeight: '700',
      color: '#FFF',
    },

    // Error banner
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(220,38,38,0.08)',
      borderRadius: BorderRadius.sm,
      padding: 12,
      marginBottom: 16,
    },
    errorText: { flex: 1, fontSize: FontSizes.sm },

    // Form
    form: { width: '100%', marginBottom: 16 },
    row: { flexDirection: 'row' },
    fieldWrap: { marginBottom: 18 },
    label: {
      fontSize: FontSizes.sm,
      fontWeight: '600',
      marginBottom: 7,
      marginLeft: 2,
    },
    input: {
      borderRadius: BorderRadius.sm + 4,
      padding: 14,
      fontSize: FontSizes.lg,
      borderWidth: 1,
    },

    // Gender selector
    genderRow: { flexDirection: 'row', gap: 10 },
    genderChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: BorderRadius.sm,
      borderWidth: 1.5,
    },
    genderChipText: {
      fontSize: FontSizes.md,
      fontWeight: '600',
    },

    // Cost row
    costRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 4,
    },
    costText: { fontSize: FontSizes.md, fontWeight: '600' },
    costBalance: { fontSize: FontSizes.sm },

    // Generate button
    generateBtn: {
      width: '100%',
      height: 54,
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      elevation: 4,
    },
    generateBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },

    // ── Drawing step ────────────────────────────────────────────────────────
    drawingContainer: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 40,
      paddingHorizontal: Spacing.xl,
    },
    canvasBox: {
      width: SCREEN_WIDTH * 0.62,
      height: SCREEN_WIDTH * 0.82,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      marginBottom: 32,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    silhouettePlaceholder: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brushWrap: {
      position: 'absolute',
      zIndex: 5,
      bottom: 40,
    },
    canvasReveal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    drawingMsg: {
      fontSize: FontSizes.lg,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 18,
      lineHeight: 22,
    },
    progressTrack: {
      width: '100%',
      height: 5,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },

    // ── Result step ─────────────────────────────────────────────────────────
    resultContainer: { padding: Spacing.lg, alignItems: 'center' },
    portraitImageWrap: {
        width: 240, height: 300, borderRadius: 20, borderWidth: 1,
        overflow: 'hidden', marginBottom: 18, justifyContent: 'center', alignItems: 'center',
    },
    portraitImage: { width: '100%', height: '100%' },
    portraitLoading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    resultTitle: {
      fontSize: FontSizes.xxxl,
      fontWeight: '800',
      marginBottom: 6,
    },
    resultSubtitle: {
      fontSize: FontSizes.md,
      marginBottom: 20,
      textAlign: 'center',
    },

    // Pills
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
      justifyContent: 'center',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    pillText: { fontSize: FontSizes.sm, fontWeight: '600' },

    // Cosmic scroll card
    scrollCard: {
      width: '100%',
      borderRadius: BorderRadius.lg,
      padding: 22,
      marginBottom: 24,
      borderWidth: 1,
    },
    scrollOrnament: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: 10,
    },
    scrollLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
    },
    scrollSectionLabel: {
      fontSize: FontSizes.xs + 1,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 16,
    },
    scrollSection: {
      marginBottom: 18,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    sectionHeaderText: {
      fontSize: FontSizes.md,
      fontWeight: '700',
    },
    scrollText: {
      fontSize: FontSizes.md,
      lineHeight: 24,
      fontStyle: 'italic',
    },

    // Compatibility bar
    compatRow: {
      marginTop: 8,
      marginBottom: 12,
      alignItems: 'center',
    },
    compatLabel: {
      fontSize: FontSizes.xs + 1,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    compatBarTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 6,
    },
    compatBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    compatValue: {
      fontSize: FontSizes.xxl,
      fontWeight: '800',
    },

    watermarkText: {
      fontStyle: 'italic',
      fontSize: FontSizes.xs,
      textAlign: 'center',
      marginTop: 4,
    },

    // Action buttons
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    actionBtn: {
      flex: 1,
      height: 50,
      borderRadius: BorderRadius.sm + 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    actionBtnText: {
      fontSize: FontSizes.md + 1,
      fontWeight: '700',
      color: '#FFF',
    },
    actionBtnOutline: {
      flex: 1,
      height: 50,
      borderRadius: BorderRadius.sm + 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1.5,
    },
    actionBtnOutlineText: {
      fontSize: FontSizes.md + 1,
      fontWeight: '700',
    },
  });
