// Face Reading Screen — Astrology-based face analysis
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Ellipse, Circle } from 'react-native-svg';
import { detectSubject } from '../services/imageDetection';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { chatWithImage } from '../services/geminiService';
import { Spacing, Colors } from '../config/theme';
import { tracker } from '../services/eventTracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - Spacing.lg * 2;
const TOKEN_COST = 25;

// ─── Face region data ────────────────────────────────────────────────────────
interface FaceRegion {
  key: string;
  label: string;
  icon: string;
  description: string;
  dotPosition: { top: string; left: string };
}

const FACE_REGIONS: FaceRegion[] = [
  {
    key: 'forehead',
    label: 'Forehead',
    icon: 'bulb-outline',
    description: 'Mental capacity & wisdom',
    dotPosition: { top: '22%', left: '50%' },
  },
  {
    key: 'eyes',
    label: 'Eyes',
    icon: 'eye-outline',
    description: 'Soul expression & intuition',
    dotPosition: { top: '38%', left: '35%' },
  },
  {
    key: 'nose',
    label: 'Nose',
    icon: 'navigate-outline',
    description: 'Leadership & power',
    dotPosition: { top: '50%', left: '50%' },
  },
  {
    key: 'mouth',
    label: 'Mouth',
    icon: 'chatbubble-outline',
    description: 'Emotional expression & communication',
    dotPosition: { top: '64%', left: '50%' },
  },
  {
    key: 'chin',
    label: 'Chin',
    icon: 'shield-outline',
    description: 'Determination & willpower',
    dotPosition: { top: '76%', left: '50%' },
  },
  {
    key: 'jawline',
    label: 'Jawline',
    icon: 'fitness-outline',
    description: 'Resilience & strength',
    dotPosition: { top: '68%', left: '28%' },
  },
];

// Elemental mapping by face shape
const ELEMENTS = {
  Water: { label: 'Water', shape: 'Round', color: Colors.accent.cyan, icon: 'water-outline' },
  Air: { label: 'Air', shape: 'Oval', color: Colors.accent.blue, icon: 'cloud-outline' },
  Earth: { label: 'Earth', shape: 'Square', color: Colors.accent.green, icon: 'globe-outline' },
  Fire: { label: 'Fire', shape: 'Heart', color: Colors.accent.orange, icon: 'flame-outline' },
} as const;

type ElementKey = keyof typeof ELEMENTS;

// Interpretations per region (randomized selection)
const REGION_INTERPRETATIONS: Record<string, string[]> = {
  forehead: [
    'Your broad forehead reveals a mind capable of deep analytical thought and strategic planning.',
    'The proportions of your forehead indicate strong intellectual curiosity and philosophical depth.',
    'Your forehead structure suggests an innate wisdom and ability to see the bigger picture.',
  ],
  eyes: [
    'Your eyes carry the depth of an old soul, indicating powerful intuitive capabilities.',
    'The spacing and shape of your eyes suggest heightened empathy and emotional intelligence.',
    'Your gaze reflects a perceptive nature, able to read situations and people with ease.',
  ],
  nose: [
    'Your nose structure indicates natural leadership qualities and a commanding presence.',
    'The bridge and width of your nose reveal ambition and determination in pursuits of power.',
    'Your nasal features suggest a balanced approach to authority, blending strength with fairness.',
  ],
  mouth: [
    'Your lip shape reveals an expressive communicator who can captivate audiences with words.',
    'The contours of your mouth indicate emotional openness and genuine warmth in relationships.',
    'Your mouth structure suggests a talent for diplomacy and the ability to mediate conflicts.',
  ],
  chin: [
    'Your chin projects unwavering determination and resilience in the face of challenges.',
    'The shape of your chin indicates a strong willpower that drives you toward your goals.',
    'Your chin structure reveals persistence and the ability to weather life storms with grace.',
  ],
  jawline: [
    'Your defined jawline indicates inner strength and the capacity to endure prolonged challenges.',
    'The angles of your jaw reveal a resilient spirit that grows stronger through adversity.',
    'Your jawline structure suggests a grounded, reliable nature that others instinctively trust.',
  ],
};

interface RegionResult {
  key: string;
  label: string;
  icon: string;
  score: number;
  interpretation: string;
}

interface AnalysisResult {
  regions: RegionResult[];
  element: ElementKey;
  aiSummary: string;
}

// ─── Face guide overlay (SVG oval) ──────────────────────────────────────────
const FaceGuideOverlay: React.FC<{ size: number }> = ({ size }) => (
  <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Ellipse
        cx={size / 2}
        cy={size / 2}
        rx={size * 0.3}
        ry={size * 0.4}
        stroke="rgba(157, 78, 221, 0.6)"
        strokeWidth={2}
        strokeDasharray="8 6"
        fill="none"
      />
    </Svg>
  </View>
);

// ─── Landmark dots on result photo ──────────────────────────────────────────
const LandmarkDots: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <View style={StyleSheet.absoluteFill}>
    {FACE_REGIONS.map((region) => (
      <View
        key={region.key}
        style={{
          position: 'absolute',
          top: region.dotPosition.top as any,
          left: region.dotPosition.left as any,
          marginLeft: -4,
          marginTop: -4,
        }}
      >
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: accentColor,
          shadowColor: accentColor,
          shadowOpacity: 0.8,
          shadowRadius: 6,
          elevation: 4,
        }} />
      </View>
    ))}
    {/* Additional symmetry dots */}
    <View style={{
      position: 'absolute', top: '38%' as any, left: '65%' as any,
      marginLeft: -4, marginTop: -4,
    }}>
      <View style={{
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: accentColor,
        shadowColor: accentColor, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
      }} />
    </View>
    <View style={{
      position: 'absolute', top: '68%' as any, left: '72%' as any,
      marginLeft: -4, marginTop: -4,
    }}>
      <View style={{
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: accentColor,
        shadowColor: accentColor, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
      }} />
    </View>
  </View>
);

// ─── Score bar component ────────────────────────────────────────────────────
const ScoreBar: React.FC<{ score: number; color: string; bgColor: string }> = ({ score, color, bgColor }) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: score / 100,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: bgColor, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', borderRadius: 3, backgroundColor: color, width: barWidth }} />
    </View>
  );
};

// ─── Determine face shape from image aspect ratio ───────────────────────────
const determineFaceShape = (): ElementKey => {
  // Since we crop to 1:1, use randomized heuristic weighted by common shapes
  const rand = Math.random();
  if (rand < 0.3) return 'Water';   // round
  if (rand < 0.55) return 'Air';    // oval (most common)
  if (rand < 0.75) return 'Earth';  // square
  return 'Fire';                     // heart
};

// ─── AI system prompt ───────────────────────────────────────────────────────
const buildSystemPrompt = (element: ElementKey, regions: RegionResult[]): string => {
  const regionSummary = regions
    .map(r => `${r.label}: ${r.score}/100 — ${r.interpretation}`)
    .join('\n');

  return `You are a mystical astrology-based face reader. The user has uploaded a face photo.
Based on the analysis, their dominant element is ${ELEMENTS[element].label} (${ELEMENTS[element].shape} face shape).

Face region analysis:
${regionSummary}

Write a 3-4 sentence overall character summary combining all these traits. Be insightful, mystical yet grounded.
Do not use emojis. Speak in second person ("You..."). Keep it under 80 words.`;
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const FaceReadingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { user, removeTokens } = useStore();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Track screen view
  useFocusEffect(
    useCallback(() => {
      tracker.track('screen_view', { screen: 'FaceReading' });
    }, [])
  );

  // ── Animations ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAnalyzing) {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      scanLoop.start();
      scanLoopRef.current = scanLoop;

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
      pulseLoopRef.current = pulseLoop;
    } else {
      scanLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
      scanAnim.setValue(0);
      pulseAnim.setValue(1);
      if (result) {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }
    }
  }, [isAnalyzing, result]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, IMAGE_SIZE - 4],
  });

  // ── Image pickers ──────────────────────────────────────────────────────────
  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Camera access is needed for face reading.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      tracker.track('feature_tap', { feature: 'face_reading', source: 'camera' });
      processImage(res.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      tracker.track('feature_tap', { feature: 'face_reading', source: 'gallery' });
      processImage(res.assets[0].uri);
    }
  };

  // ── Process & analyze ─────────────────────────────────────────────────────
  const processImage = async (uri: string) => {
    // Token check
    const isPremium = user?.isPremium === true;
    if (!isPremium) {
      const hasTokens = (user?.tokens ?? 0) >= TOKEN_COST;
      if (!hasTokens) {
        Alert.alert(
          'Insufficient Tokens',
          `Face reading requires ${TOKEN_COST} Moon Tokens. Visit the shop to get more.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Get Tokens', onPress: () => (navigation as any).navigate('Premium') },
          ]
        );
        return;
      }
    }

    setSelectedImage(uri);
    setIsAnalyzing(true);
    setResult(null);
    fadeAnim.setValue(0);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // On-device face gate — acceptance-biased: only blocks when the photo clearly
      // shows something other than a face (never wrongly rejects a real face).
      const faceCheck = await detectSubject(uri, 'face');
      if (!faceCheck.accepted) {
        setIsAnalyzing(false);
        setSelectedImage(null);
        Alert.alert('No Face Detected', 'Please upload a clear photo with a visible human face.');
        return;
      }

      // Deduct tokens
      if (!isPremium) {
        removeTokens(TOKEN_COST);
      }

      // Generate region scores
      const regions: RegionResult[] = FACE_REGIONS.map((region) => {
        const interpretations = REGION_INTERPRETATIONS[region.key];
        return {
          key: region.key,
          label: region.label,
          icon: region.icon,
          score: Math.floor(Math.random() * 20 + 75), // 75-94
          interpretation: interpretations[Math.floor(Math.random() * interpretations.length)],
        };
      });

      // Determine dominant element
      const element = determineFaceShape();

      // Get AI summary
      let aiSummary = '';
      try {
        const prompt = buildSystemPrompt(element, regions);
        aiSummary = await chatWithImage(uri, 'Analyze this face.', prompt);
        // Clean any <think> tags (DeepSeek)
        aiSummary = aiSummary.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      } catch {
        // Fallback summary
        aiSummary = `Your ${ELEMENTS[element].shape.toLowerCase()} face shape aligns you with the ${ELEMENTS[element].label} element, suggesting a personality that balances ${regions[0].label.toLowerCase()} intelligence with ${regions[3].label.toLowerCase()} expressiveness. The proportions of your features reveal someone who navigates life with both intuition and determination.`;
      }

      // Minimum scan animation time
      await new Promise((r) => setTimeout(r, 2500));

      setResult({ regions, element, aiSummary });
      tracker.track('feature_complete', { feature: 'face_reading', element });
    } catch {
      Alert.alert('Error', 'Face analysis could not be completed. Please try again.');
      setSelectedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    fadeAnim.setValue(0);
  };

  // ── Derived theme values ──────────────────────────────────────────────────
  const accent = Colors.accent.purple;
  const cardBg = colors.card;
  const borderColor = colors.border;
  const secondaryText = colors.textSecondary;
  const surfaceBg = colors.surface;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: surfaceBg }]}
            >
              <ArrowCircleLeftIcon size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('faceReading')}</Text>
            <View style={{ width: 36 }} />
          </View>

          {!selectedImage ? (
            /* ── Upload section ── */
            <View style={styles.uploadSection}>
              {/* Placeholder with face guide */}
              <View style={[styles.placeholderContainer, { backgroundColor: cardBg, borderColor }]}>
                <FaceGuideOverlay size={200} />
                <View style={styles.placeholderInner}>
                  <Ionicons name="scan-outline" size={56} color={accent} style={{ opacity: 0.5 }} />
                </View>
                {/* Corner brackets */}
                <View style={[styles.scanCorner, styles.scanTL, { borderColor: accent }]} />
                <View style={[styles.scanCorner, styles.scanTR, { borderColor: accent }]} />
                <View style={[styles.scanCorner, styles.scanBL, { borderColor: accent }]} />
                <View style={[styles.scanCorner, styles.scanBR, { borderColor: accent }]} />
              </View>

              <Text style={[styles.titleText, { color: colors.text }]}>{t('aiFaceAnalysis')}</Text>
              <Text style={[styles.subtitleText, { color: secondaryText }]}>
                Upload a clear face photo for an astrology-based reading of your personality, destiny, and elemental alignment.
              </Text>

              {/* Token cost badge */}
              <View style={[styles.costBadge, { backgroundColor: isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.06)' }]}>
                <Ionicons name="moon-outline" size={14} color={accent} />
                <Text style={[styles.costText, { color: accent }]}>{TOKEN_COST} Moon Tokens</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: accent }]}
                  onPress={pickFromCamera}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>{t('camera')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: cardBg, borderWidth: 1.5, borderColor: accent }]}
                  onPress={pickFromGallery}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images" size={20} color={accent} />
                  <Text style={[styles.actionBtnText, { color: accent }]}>{t('gallery')}</Text>
                </TouchableOpacity>
              </View>

              {/* Feature chips */}
              <View style={styles.chipRow}>
                {FACE_REGIONS.slice(0, 4).map((region) => (
                  <View
                    key={region.key}
                    style={[styles.chip, {
                      backgroundColor: isDark ? 'rgba(157,78,221,0.1)' : 'rgba(157,78,221,0.06)',
                      borderColor: isDark ? 'rgba(157,78,221,0.2)' : 'rgba(157,78,221,0.15)',
                    }]}
                  >
                    <Ionicons name={region.icon as any} size={12} color={accent} />
                    <Text style={[styles.chipText, { color: secondaryText }]}>{region.label}</Text>
                  </View>
                ))}
              </View>

              {/* How it works */}
              <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>{t('howItWorks')}</Text>
                {[
                  'Upload a clear, front-facing photo',
                  'AI maps 6 facial regions to personality traits',
                  'Get your dominant element and character summary',
                ].map((step, i) => (
                  <View key={i} style={styles.infoStep}>
                    <View style={[styles.stepDot, { backgroundColor: accent }]}>
                      <Text style={styles.stepNumber}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.infoStepText, { color: secondaryText }]}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            /* ── Analysis / Result section ── */
            <View style={styles.analysisSection}>
              {/* Photo with overlays */}
              <Animated.View
                style={[
                  styles.imageWrapper,
                  { backgroundColor: colors.background, transform: [{ scale: isAnalyzing ? pulseAnim : 1 }] },
                ]}
              >
                <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />

                {/* Corner brackets */}
                <View style={[styles.corner, styles.cornerTL, { borderColor: Colors.accent.cyan }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: Colors.accent.cyan }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: Colors.accent.cyan }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: Colors.accent.cyan }]} />

                {/* Scan line animation */}
                {isAnalyzing && (
                  <>
                    <Animated.View
                      style={[styles.scanLine, {
                        backgroundColor: Colors.accent.cyan,
                        shadowColor: Colors.accent.cyan,
                        transform: [{ translateY }],
                      }]}
                    />
                    <FaceGuideOverlay size={IMAGE_SIZE} />
                  </>
                )}

                {/* Landmark dots on result */}
                {!isAnalyzing && result && (
                  <LandmarkDots accentColor={Colors.accent.cyan} />
                )}
              </Animated.View>

              {isAnalyzing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={accent} />
                  <Text style={[styles.loadingTitle, { color: colors.text }]}>
                    Analyzing your features...
                  </Text>
                  <Text style={[styles.loadingSubtitle, { color: secondaryText }]}>
                    Mapping facial regions to astrological traits
                  </Text>
                </View>
              ) : result ? (
                <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>

                  {/* Dominant Element Card */}
                  <View style={[styles.elementCard, { backgroundColor: cardBg, borderColor }]}>
                    <View style={[styles.elementIconWrap, { backgroundColor: `${ELEMENTS[result.element].color}18` }]}>
                      <Ionicons
                        name={ELEMENTS[result.element].icon as any}
                        size={28}
                        color={ELEMENTS[result.element].color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.elementLabel, { color: secondaryText }]}>{t('dominantElement')}</Text>
                      <Text style={[styles.elementName, { color: ELEMENTS[result.element].color }]}>
                        {ELEMENTS[result.element].label}
                      </Text>
                      <Text style={[styles.elementShape, { color: secondaryText }]}>
                        {ELEMENTS[result.element].shape} face shape detected
                      </Text>
                    </View>
                  </View>

                  {/* AI Summary Card */}
                  <View style={[styles.summaryCard, {
                    backgroundColor: isDark ? 'rgba(157,78,221,0.08)' : 'rgba(157,78,221,0.04)',
                    borderColor: isDark ? 'rgba(157,78,221,0.2)' : 'rgba(157,78,221,0.12)',
                  }]}>
                    <View style={styles.summaryHeader}>
                      <Ionicons name="finger-print" size={18} color={accent} />
                      <Text style={[styles.summaryTitle, { color: accent }]}>{t('characterSummary')}</Text>
                    </View>
                    <Text style={[styles.summaryText, { color: colors.text }]}>{result.aiSummary}</Text>
                  </View>

                  {/* 6 Region Analysis Cards */}
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('facialRegionAnalysis')}</Text>
                  {result.regions.map((region) => (
                    <View key={region.key} style={[styles.regionCard, { backgroundColor: cardBg, borderColor }]}>
                      <View style={styles.regionHeader}>
                        <View style={[styles.regionIconWrap, { backgroundColor: isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.06)' }]}>
                          <Ionicons name={region.icon as any} size={18} color={accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.regionLabel, { color: colors.text }]}>{region.label}</Text>
                        </View>
                        <Text style={[styles.regionScore, { color: accent }]}>{region.score}/100</Text>
                      </View>
                      <ScoreBar score={region.score} color={accent} bgColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                      <Text style={[styles.regionInterpretation, { color: secondaryText }]}>
                        {region.interpretation}
                      </Text>
                    </View>
                  ))}

                  {/* New Analysis button */}
                  <TouchableOpacity
                    style={[styles.newAnalysisBtn, {
                      backgroundColor: isDark ? 'rgba(157,78,221,0.1)' : 'rgba(157,78,221,0.06)',
                      borderColor: isDark ? 'rgba(157,78,221,0.25)' : 'rgba(157,78,221,0.15)',
                    }]}
                    onPress={reset}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={18} color={accent} />
                    <Text style={[styles.newAnalysisText, { color: accent }]}>{t('newAnalysis')}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : null}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const CORNER_SIZE = 22;
const CORNER_THICKNESS = 2.5;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  // Upload section
  uploadSection: {
    padding: Spacing.lg,
    alignItems: 'center',
    paddingTop: 8,
  },
  placeholderContainer: {
    width: 200,
    height: 200,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    position: 'relative',
  },
  placeholderInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCorner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: CORNER_THICKNESS,
  },
  scanTL: { top: 14, left: 14, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  scanTR: { top: 14, right: 14, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  scanBL: { bottom: 14, left: 14, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  scanBR: { bottom: 14, right: 14, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  titleText: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitleText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    paddingHorizontal: 16,
  },

  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  costText: { fontSize: 13, fontWeight: '600' },

  buttonRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '500' },

  // How it works card
  infoCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  infoCardTitle: { fontSize: 15, fontWeight: '700' },
  infoStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  infoStepText: { fontSize: 13, flex: 1, lineHeight: 18 },

  // Analysis section
  analysisSection: { padding: Spacing.lg },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  uploadedImage: { width: '100%', height: '100%', opacity: 0.9 },

  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 2.5,
  },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    shadowOpacity: 1,
    shadowRadius: 10,
    zIndex: 10,
  },

  loadingContainer: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  loadingTitle: { fontSize: 16, fontWeight: '600' },
  loadingSubtitle: { fontSize: 13 },

  // Results
  resultContainer: { gap: 16 },

  // Element card
  elementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  elementIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elementLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  elementName: { fontSize: 20, fontWeight: '800' },
  elementShape: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Summary card
  summaryCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700' },
  summaryText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },

  // Region cards
  regionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  regionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionLabel: { fontSize: 15, fontWeight: '700' },
  regionScore: { fontSize: 15, fontWeight: '800' },
  regionInterpretation: { fontSize: 13, lineHeight: 19 },

  // New analysis button
  newAnalysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  newAnalysisText: { fontWeight: '700', fontSize: 14 },
});
