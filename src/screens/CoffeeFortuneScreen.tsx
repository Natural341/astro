import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MagicStarIcon, ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { chatWithAI } from '../services/geminiService';
import { detectSubject } from '../services/imageDetection';
import { Spacing } from '../config/theme';
import { tracker } from '../services/eventTracker';

// 4-step photo capture process
const STEPS = [
  {
    id: 0,
    label: 'Cup Interior — Left',
    hint: 'Photograph the left side of the cup interior after turning it over.',
    icon: 'cafe-outline' as const,
  },
  {
    id: 1,
    label: 'Cup Interior — Right',
    hint: 'Photograph the right side of the cup interior.',
    icon: 'cafe-outline' as const,
  },
  {
    id: 2,
    label: 'Cup Interior — Bottom',
    hint: 'Photograph the bottom of the cup interior.',
    icon: 'cafe' as const,
  },
  {
    id: 3,
    label: 'Saucer',
    hint: 'Photograph the saucer where the cup rested.',
    icon: 'ellipse-outline' as const,
  },
];

export const CoffeeFortuneScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const bgColor = colors.background;
  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.55)' : '#8E8E93';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB';
  const backBtnBg = isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0';

  const COFFEE = '#7C4A2A';
  const COFFEE_LIGHT = 'rgba(124,74,42,0.12)';

  useEffect(() => {
    tracker.track('screen_view', { screen: 'CoffeeFortune' });
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.92, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [isAnalyzing]);

  useEffect(() => {
    if (result) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [result]);

  const pickPhoto = async (useCamera: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    };

    let pickerResult;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      pickerResult = await ImagePicker.launchCameraAsync(options);
    } else {
      pickerResult = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      const uri = pickerResult.assets[0].uri;
      const cupCheck = await detectSubject(uri, 'coffee');
      if (!cupCheck.accepted) {
        Alert.alert('No Coffee Cup Detected', 'Please capture a clear photo of your coffee cup.');
        return;
      }
      if (currentStep === 0 && !photos[0]) {
        tracker.track('feature_tap', { feature: 'coffee_fortune' });
      }
      const newPhotos = [...photos];
      newPhotos[currentStep] = uri;
      setPhotos(newPhotos);
    }
  };

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      analyze();
    }
  };

  const analyze = async () => {
    setIsAnalyzing(true);

    // Build user context for personalized reading
    const userContext = [
      user?.birthDate ? `Birth date: ${user.birthDate}` : '',
      user?.zodiacSign ? `Zodiac sign: ${user.zodiacSign}` : '',
      user?.nickname ? `Name: ${user.nickname}` : '',
    ].filter(Boolean).join(', ');

    const prompt = `You are a professional Turkish coffee fortune teller (kahve falı). The user has submitted 3 interior cup photos and 1 saucer photo for a full reading.

${userContext ? `User profile: ${userContext}` : ''}

Please provide a rich, detailed, personalized coffee fortune reading. Structure your response as:
1. **Overall Energy** — general atmosphere of the cup
2. **Symbols Seen** — list 4–6 symbols you interpret (be creative and mystical)
3. **Love & Relationships** — what the cup reveals
4. **Career & Finances** — insights from the grounds
5. **Near Future** — what's coming in the next 30 days
6. **Advice** — a closing message for the person

Keep the tone warm, mystical, and personal. Speak directly to the person.`;

    try {
      const reading = await chatWithAI(prompt);
      setResult(reading);
      tracker.track('feature_complete', { feature: 'coffee_fortune' });
    } catch (e) {
      setResult("The coffee grounds whisper... but the connection was lost. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setPhotos([null, null, null, null]);
    setResult(null);
    fadeAnim.setValue(0);
  };

  // ─── Result view ───────────────────────────────────────────────
  if (result) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: backBtnBg }]}>
              <ArrowCircleLeftIcon size={22} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>{t('coffeeReading')}</Text>
            <View style={{ width: 38 }} />
          </View>

          <Animated.ScrollView
            style={{ opacity: fadeAnim }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Photo row */}
            <View style={styles.photoRow}>
              {photos.map((p, i) => (
                <View key={i} style={[styles.thumbContainer, { borderColor: COFFEE + '50' }]}>
                  {p ? (
                    <Image source={{ uri: p }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: COFFEE_LIGHT, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name={STEPS[i].icon} size={18} color={COFFEE} />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Reading card */}
            <View style={[styles.readingCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.readingHeader}>
                <Ionicons name="cafe" size={22} color={COFFEE} />
                <Text style={[styles.readingTitle, { color: textColor }]}>{t('yourReading')}</Text>
              </View>
              <Text style={[styles.readingText, { color: textColor }]}>{result}</Text>
            </View>

            <TouchableOpacity style={[styles.resetBtn, { borderColor: COFFEE }]} onPress={reset}>
              <Ionicons name="refresh" size={18} color={COFFEE} />
              <Text style={[styles.resetBtnText, { color: COFFEE }]}>{t('newReading')}</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </Animated.ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Analyzing view ────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.pulseRing, { borderColor: COFFEE + '40', transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.pulseInner, { backgroundColor: COFFEE_LIGHT }]}>
            <Ionicons name="cafe" size={40} color={COFFEE} />
          </View>
        </Animated.View>
        <Text style={[styles.analyzingTitle, { color: textColor }]}>{t('readingGrounds')}</Text>
        <Text style={[styles.analyzingSubtitle, { color: secondaryText }]}>{t('interpretingSymbols')}</Text>
        <ActivityIndicator color={COFFEE} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ─── Photo capture flow ────────────────────────────────────────
  const step = STEPS[currentStep];
  const currentPhoto = photos[currentStep];
  const allDone = photos.every(p => p !== null);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: backBtnBg }]}>
            <ArrowCircleLeftIcon size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('coffeeReading')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Progress stepper */}
          <View style={styles.stepper}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <TouchableOpacity
                  onPress={() => photos[i] && setCurrentStep(i)}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        i < currentStep
                          ? COFFEE
                          : i === currentStep
                          ? 'transparent'
                          : isDark ? 'rgba(255,255,255,0.1)' : '#E8E8E8',
                      borderColor: i === currentStep ? COFFEE : 'transparent',
                      borderWidth: i === currentStep ? 2 : 0,
                    },
                  ]}
                >
                  {i < currentStep ? (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  ) : (
                    <Text style={[styles.stepNum, { color: i === currentStep ? COFFEE : secondaryText }]}>
                      {i + 1}
                    </Text>
                  )}
                </TouchableOpacity>
                {i < 3 && (
                  <View style={[styles.stepLine, { backgroundColor: i < currentStep ? COFFEE : isDark ? 'rgba(255,255,255,0.1)' : '#E8E8E8' }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Step label */}
          <Text style={[styles.stepLabel, { color: textColor }]}>{step.label}</Text>
          <Text style={[styles.stepHint, { color: secondaryText }]}>{step.hint}</Text>

          {/* Photo preview or placeholder */}
          <View style={[styles.photoArea, { backgroundColor: cardBg, borderColor: currentPhoto ? COFFEE + '60' : borderColor }]}>
            {currentPhoto ? (
              <>
                <Image source={{ uri: currentPhoto }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={[styles.retakeBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)' }]}
                  onPress={() => {
                    const n = [...photos];
                    n[currentStep] = null;
                    setPhotos(n);
                  }}
                >
                  <Ionicons name="refresh" size={18} color={COFFEE} />
                  <Text style={[styles.retakeBtnText, { color: COFFEE }]}>{t('retake')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={[styles.photoPlaceholderIcon, { backgroundColor: COFFEE_LIGHT }]}>
                  <Ionicons name={step.icon} size={36} color={COFFEE} />
                </View>
                <Text style={[styles.photoPlaceholderText, { color: secondaryText }]}>
                  No photo yet
                </Text>
              </View>
            )}
          </View>

          {/* Thumbnail row */}
          <View style={styles.thumbRow}>
            {STEPS.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => photos[i] && setCurrentStep(i)}
                style={[
                  styles.thumbSmall,
                  {
                    borderColor: i === currentStep ? COFFEE : borderColor,
                    borderWidth: i === currentStep ? 2 : 1,
                    backgroundColor: cardBg,
                  },
                ]}
              >
                {photos[i] ? (
                  <Image source={{ uri: photos[i]! }} style={styles.thumbSmallImg} />
                ) : (
                  <Ionicons name={s.icon} size={16} color={i === currentStep ? COFFEE : secondaryText} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Pick photo buttons */}
          {!currentPhoto && (
            <View style={styles.pickButtons}>
              <TouchableOpacity
                style={[styles.pickBtn, styles.pickBtnOutline, { borderColor: COFFEE }]}
                onPress={() => pickPhoto(true)}
              >
                <Ionicons name="camera" size={20} color={COFFEE} />
                <Text style={[styles.pickBtnText, { color: COFFEE }]}>{t('camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickBtn, { backgroundColor: COFFEE }]}
                onPress={() => pickPhoto(false)}
              >
                <Ionicons name="images" size={20} color="#FFF" />
                <Text style={[styles.pickBtnText, { color: '#FFF' }]}>{t('gallery')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Next / Analyze button */}
          {currentPhoto && (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: COFFEE }]}
              onPress={goNext}
            >
              <Text style={styles.nextBtnText}>
                {currentStep < 3 ? `Next  →  ${STEPS[currentStep + 1].label}` : 'Analyze Fortune'}
              </Text>
              {currentStep < 3 ? <Ionicons name="arrow-forward" size={18} color="#FFF" /> : <MagicStarIcon size={18} color="#FFF" />}
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  scrollContent: { padding: Spacing.lg },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { fontSize: 13, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, marginHorizontal: 4 },

  stepLabel: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  stepHint: { fontSize: 14, lineHeight: 20, marginBottom: 20 },

  // Photo area
  photoArea: {
    height: 260,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  retakeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  retakeBtnText: { fontSize: 13, fontWeight: '600' },
  photoPlaceholder: { alignItems: 'center', gap: 12 },
  photoPlaceholderIcon: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  photoPlaceholderText: { fontSize: 14 },

  // Thumb row
  thumbRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  thumbSmall: {
    width: 60, height: 60, borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  thumbSmallImg: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Pick buttons
  pickButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickBtn: {
    flex: 1, height: 52, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  pickBtnOutline: { borderWidth: 1.5, backgroundColor: 'transparent' },
  pickBtnText: { fontSize: 15, fontWeight: '600' },

  // Next button
  nextBtn: {
    height: 54, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Analyzing
  pulseRing: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28,
  },
  pulseInner: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
  },
  analyzingTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  analyzingSubtitle: { fontSize: 14 },

  // Result
  photoRow: { flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'center' },
  thumbContainer: {
    width: 70, height: 70, borderRadius: 12,
    borderWidth: 1.5, overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  readingCard: {
    borderRadius: 20, borderWidth: 1,
    padding: 20, marginBottom: 20,
  },
  readingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  readingTitle: { fontSize: 17, fontWeight: '700' },
  readingText: { fontSize: 15, lineHeight: 24 },
  resetBtn: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  resetBtnText: { fontSize: 15, fontWeight: '600' },
});
