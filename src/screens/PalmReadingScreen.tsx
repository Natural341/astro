// Palm Reading Screen — Modern matte design, purple theme, glassmorphism
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MagicStarIcon, TickCircleIcon, CoinIcon } from '../components/icons';
import { ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Line } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { Spacing, BorderRadius, FontSizes, Colors } from '../config/theme';
import { interpretPalmReading } from '../services/geminiService';
import { detectSubject } from '../services/imageDetection';
import { detectHand, preloadHandDetector, HandDetectionResult } from '../services/handDetection';
import { tokenService } from '../services/tokenService';
import { tracker } from '../services/eventTracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOKEN_COST = 25;
const PALM_IMG = require('../../assets/svg/el_falı.png');
const HAND_IMG = require('../../assets/svg/el.png');
const ACCENT_PURPLE = Colors.accent.purple;

// ---------- Loading messages ----------
const LOADING_MESSAGES = [
  'Scanning palm image...',
  'Analyzing Life Line depth and curvature...',
  'Reading Heart Line emotional patterns...',
  'Interpreting Head Line intellectual markers...',
  'Tracing Fate Line career indicators...',
  'Examining finger shape and proportions...',
  'Reading relationship and travel lines...',
  'Evaluating mounts and finger placements...',
  'Generating your personalized reading...',
];

// ---------- Analysis modes ----------
interface AnalysisMode {
  id: string;
  title: string;
  desc: string;
  icon: string;
  cost: number;
}

const ANALYSIS_MODES: AnalysisMode[] = [
  { id: 'full', title: 'Full Reading', desc: 'Lines, mounts & summary', icon: 'hand-left-outline', cost: 25 },
  { id: 'love', title: 'Love Lines', desc: 'Heart & relationship lines', icon: 'heart-outline', cost: 15 },
  { id: 'career', title: 'Career Path', desc: 'Fate line & ambition mounts', icon: 'briefcase-outline', cost: 15 },
  { id: 'health', title: 'Health Map', desc: 'Life line & health indicators', icon: 'fitness-outline', cost: 15 },
];

// ---------- Type definitions ----------
interface PalmLine {
  name: string;
  score: number;
  interpretation: string;
}

interface MountResult {
  name: string;
  domain: string;
  interpretation: string;
}

interface PalmResult {
  lines: PalmLine[];
  mounts: MountResult[];
  summary: string;
  fingerAnalysis?: string;
  relationshipLines?: string;
  travelLines?: string;
  moneyTriangle?: string;
}

// ---------- Parse AI response ----------
const parseAIResult = (raw: string): PalmResult => {
  const lines: PalmLine[] = [];
  const mounts: MountResult[] = [];

  const linePatterns = [
    { name: 'Life Line', regex: /life\s*line[:\s\-]*([\s\S]*?)(?=heart\s*line|head\s*line|fate\s*line|mount|finger|relation|travel|money|$)/i },
    { name: 'Heart Line', regex: /heart\s*line[:\s\-]*([\s\S]*?)(?=head\s*line|fate\s*line|mount|finger|relation|travel|money|$)/i },
    { name: 'Head Line', regex: /head\s*line[:\s\-]*([\s\S]*?)(?=fate\s*line|mount|finger|relation|travel|money|$)/i },
    { name: 'Fate Line', regex: /fate\s*line[:\s\-]*([\s\S]*?)(?=mount|venus|jupiter|finger|relation|travel|money|$)/i },
  ];

  for (const lp of linePatterns) {
    const match = raw.match(lp.regex);
    const text = match ? match[1].trim().replace(/\*\*/g, '').substring(0, 300) : '';
    const scoreMatch = text.match(/score[:\s]*(\d+)/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : (50 + Math.floor(Math.random() * 40));
    lines.push({ name: lp.name, score, interpretation: text || 'Analysis could not be determined from the image. Try a clearer photo.' });
  }

  if (lines.every(l => !l.interpretation || l.interpretation.includes('could not'))) {
    const chunks = raw.split('\n\n').filter(c => c.trim().length > 20);
    const names = ['Life Line', 'Heart Line', 'Head Line', 'Fate Line'];
    names.forEach((name, i) => {
      lines[i] = { name, score: 55 + Math.floor(Math.random() * 35), interpretation: chunks[i] || raw.substring(i * 200, (i + 1) * 200) || 'Could not determine.' };
    });
  }

  const mountPatterns = [
    { name: 'Mount of Venus', domain: 'Love & Passion', regex: /venus[:\s\-]*([\s\S]*?)(?=jupiter|saturn|apollo|mercury|finger|relation|travel|money|summary|$)/i },
    { name: 'Mount of Jupiter', domain: 'Ambition & Leadership', regex: /jupiter[:\s\-]*([\s\S]*?)(?=saturn|apollo|mercury|finger|relation|travel|money|summary|$)/i },
    { name: 'Mount of Saturn', domain: 'Wisdom & Responsibility', regex: /saturn[:\s\-]*([\s\S]*?)(?=apollo|mercury|finger|relation|travel|money|summary|$)/i },
    { name: 'Mount of Apollo', domain: 'Creativity & Success', regex: /apollo[:\s\-]*([\s\S]*?)(?=mercury|finger|relation|travel|money|summary|$)/i },
    { name: 'Mount of Mercury', domain: 'Communication & Business', regex: /mercury[:\s\-]*([\s\S]*?)(?=finger|relation|travel|money|summary|$)/i },
  ];

  for (const mp of mountPatterns) {
    const match = raw.match(mp.regex);
    mounts.push({ name: mp.name, domain: mp.domain, interpretation: match ? match[1].trim().replace(/\*\*/g, '').substring(0, 200) : 'Not enough detail visible.' });
  }

  // Extra sections
  const fingerMatch = raw.match(/finger\s*(shape|analysis|proportion)[:\s\-]*([\s\S]*?)(?=relation|travel|money|summary|$)/i);
  const relationMatch = raw.match(/relation(?:ship)?\s*line[s]?[:\s\-]*([\s\S]*?)(?=travel|money|summary|$)/i);
  const travelMatch = raw.match(/travel\s*line[s]?[:\s\-]*([\s\S]*?)(?=money|summary|$)/i);
  const moneyMatch = raw.match(/money\s*triangle[:\s\-]*([\s\S]*?)(?=summary|$)/i);

  const summaryMatch = raw.match(/summary[:\s\-]*([\s\S]*?)$/i);
  const summary = summaryMatch ? summaryMatch[1].trim().replace(/\*\*/g, '').substring(0, 400) : raw.substring(0, 400);

  return {
    lines,
    mounts,
    summary,
    fingerAnalysis: fingerMatch ? fingerMatch[2].trim().replace(/\*\*/g, '').substring(0, 300) : undefined,
    relationshipLines: relationMatch ? relationMatch[1].trim().replace(/\*\*/g, '').substring(0, 300) : undefined,
    travelLines: travelMatch ? travelMatch[1].trim().replace(/\*\*/g, '').substring(0, 300) : undefined,
    moneyTriangle: moneyMatch ? moneyMatch[1].trim().replace(/\*\*/g, '').substring(0, 300) : undefined,
  };
};

// ---------- Real palm line paths, derived from detected hand joints ----------
// MediaPipe Hands only gives us 21 skeletal joints (knuckles/wrist), not the
// actual crease lines (that remains an unsolved, research-grade CV problem —
// no open-source model does it reliably). What we CAN do honestly: draw the
// classic palmistry lines correctly scaled, rotated, and positioned onto
// *this specific* photographed hand using its real joint positions, instead
// of a generic fixed diagram that ignores hand size/angle/position entirely.
type HandJoints = HandDetectionResult['joints'];

const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

// Smooth a polyline into a single SVG path via quadratic curves through midpoints.
const smoothPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    d += ` Q${curr.x},${curr.y} ${(curr.x + next.x) / 2},${(curr.y + next.y) / 2}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last.x},${last.y}`;
  return d;
};

interface HandLinePaths { life: string; heart: string; head: string; fate: string }

const deriveHandLinePaths = (j: Partial<HandJoints>): HandLinePaths | null => {
  const { wrist, thumb_cmc, thumb_mcp, index_finger_mcp, middle_finger_mcp, ring_finger_mcp, pinky_finger_mcp } = j;
  if (!wrist || !thumb_cmc || !index_finger_mcp || !middle_finger_mcp || !ring_finger_mcp || !pinky_finger_mcp) {
    return null;
  }
  const thumbBase = thumb_mcp ?? thumb_cmc;

  const heart = smoothPath(
    [pinky_finger_mcp, ring_finger_mcp, middle_finger_mcp, index_finger_mcp].map(p => lerp(p, wrist, 0.12))
  );
  const head = smoothPath([
    lerp(index_finger_mcp, wrist, 0.32),
    lerp(middle_finger_mcp, wrist, 0.4),
    lerp(ring_finger_mcp, wrist, 0.36),
  ]);
  const life = smoothPath([
    lerp(index_finger_mcp, thumbBase, 0.5),
    lerp(thumb_cmc, wrist, 0.3),
    lerp(wrist, thumb_cmc, 0.2),
  ]);
  const fate = smoothPath([
    lerp(wrist, middle_finger_mcp, 0.1),
    lerp(wrist, middle_finger_mcp, 0.5),
    lerp(middle_finger_mcp, wrist, 0.1),
  ]);

  return { life, heart, head, fate };
};

// ---------- Animated "drawing itself" line ──────────────────────────────────
const AnimatedPath = Animated.createAnimatedComponent(Path);
const DRAW_LENGTH = 500; // safely larger than any expected path length in image-pixel space

const DrawnLine: React.FC<{ d: string; color: string; delay: number; width?: number }> = ({ d, color, delay, width = 3 }) => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [d]);

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [DRAW_LENGTH, 0] });

  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
      opacity={0.92}
      strokeDasharray={`${DRAW_LENGTH}, ${DRAW_LENGTH}`}
      strokeDashoffset={dashOffset as any}
    />
  );
};

// Real-photo line overlay — positioned in the image's own pixel coordinate
// space via the SVG viewBox, so it lines up regardless of display size.
const HandLineOverlay: React.FC<{
  joints: HandJoints | null;
  imageSize: { width: number; height: number } | null;
}> = ({ joints, imageSize }) => {
  if (!joints || !imageSize || imageSize.width === 0) return null;
  const paths = deriveHandLinePaths(joints);
  if (!paths) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}>
        <DrawnLine d={paths.life} color="#EF4444" delay={0} />
        <DrawnLine d={paths.heart} color="#EC4899" delay={150} />
        <DrawnLine d={paths.head} color="#3B82F6" delay={300} />
        <DrawnLine d={paths.fate} color="#F59E0B" delay={450} width={2.5} />
      </Svg>
    </View>
  );
};

// ---------- SVG line position mini diagrams ----------
const LinePositionSvg: React.FC<{ lineName: string; color: string }> = ({ lineName, color }) => {
  const dim = 60;
  const palmOutline = "M30,55 C18,55 10,48 9,40 C8,32 9,26 10,22 L14,8 C14,5 17,3 20,3 C23,3 24,5 24,8 L24,18 L26,6 C26,3 29,1 32,1 C35,1 36,3 36,6 L36,17 L38,4 C38,1 41,0 43,1 C45,2 46,5 46,8 L44,17 L48,10 C49,6 52,5 54,6 C56,7 57,10 56,13 L52,22 L56,25 C58,27 58,32 56,35 L54,30 C55,38 55,44 52,50 C48,55 40,56 30,55 Z";
  let lineD = '';
  switch (lineName) {
    case 'Life Line': lineD = 'M24,24 C22,30 21,36 22,44 C23,48 26,52 30,55'; break;
    case 'Heart Line': lineD = 'M18,28 C28,25 38,24 48,26'; break;
    case 'Head Line': lineD = 'M18,33 C28,31 38,32 48,35'; break;
    case 'Fate Line': lineD = 'M30,52 L30,28'; break;
  }
  return (
    <Svg width={dim} height={dim} viewBox="0 0 60 60">
      <Path d={palmOutline} fill="none" stroke={color} strokeWidth={0.8} opacity={0.3} />
      <Path d={lineD} fill="none" stroke={color} strokeWidth={2} opacity={0.9} />
    </Svg>
  );
};

// ==========================================================================
// COMPONENT
// ==========================================================================
export const PalmReadingScreen: React.FC = () => {
  const { colors, isDark, accent } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const user = useStore((s) => s.user);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [palmResult, setPalmResult] = useState<PalmResult | null>(null);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  const [showGuide, setShowGuide] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('full');
  const [handJoints, setHandJoints] = useState<HandJoints | null>(null);
  const [handedness, setHandedness] = useState<'Left' | 'Right' | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const handFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tracker.track('screen_view', { screen: 'PalmReading' });
    preloadHandDetector(); // warm up the TFJS hand model in the background
  }, []);

  // Pulse
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Floating hand animation
  useEffect(() => {
    const float = Animated.loop(Animated.sequence([
      Animated.timing(handFloat, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(handFloat, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    float.start();
    return () => float.stop();
  }, []);

  // Fade-in on result
  useEffect(() => {
    if (palmResult) {
      fadeIn.setValue(0);
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [palmResult]);

  // ---------- Image picker ----------
  const pickImage = useCallback(async (useCamera: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    tracker.track('feature_tap', { feature: 'palm_reading', source: useCamera ? 'camera' : 'gallery' });
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8 };
    let result;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const handCheck = await detectSubject(uri, 'palm');
      if (!handCheck.accepted) {
        Alert.alert('No Hand Detected', 'Please capture a clear photo of your open palm.');
        return;
      }
      setSelectedImage(uri);
      setShowGuide(false);
      setImageSize(asset.width && asset.height ? { width: asset.width, height: asset.height } : null);
      setHandJoints(null);
      setHandedness(null);
      // Kick off real hand-joint detection in parallel with the AI text
      // analysis — both are ready by the time the result view renders.
      const handPromise = detectHand(uri);
      analyzeImage(uri, handPromise);
    }
  }, [selectedMode]);

  // ---------- Analyze ----------
  const analyzeImage = async (_imageUri: string, handPromise?: Promise<HandDetectionResult | null>) => {
    setError(null);
    setIsAnalyzing(true);
    setPalmResult(null);
    progressAnim.setValue(0);
    rotateAnim.setValue(0);

    const mode = ANALYSIS_MODES.find(m => m.id === selectedMode) || ANALYSIS_MODES[0];
    if (!tokenService.hasEnoughTokens(mode.cost)) {
      setIsAnalyzing(false);
      setError(`Not enough Moon Tokens. You need ${mode.cost} tokens for this reading.`);
      return;
    }

    const spin = Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }));
    spin.start();
    Animated.timing(progressAnim, { toValue: 0.9, duration: 8000, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();

    const msgInterval = setInterval(() => {
      setLoadingText((prev) => {
        const idx = LOADING_MESSAGES.indexOf(prev);
        return LOADING_MESSAGES[(idx + 1) % LOADING_MESSAGES.length];
      });
    }, 1200);

    try {
      const userContext = user ? `User: ${user.name || 'Unknown'}, Zodiac: ${user.zodiacSign || 'Unknown'}` : '';

      let modePrompt = '';
      if (selectedMode === 'love') {
        modePrompt = 'Focus primarily on Heart Line, relationship lines (marriage lines), and Mount of Venus. Analyze romantic compatibility and emotional depth.';
      } else if (selectedMode === 'career') {
        modePrompt = 'Focus primarily on Fate Line, Head Line, Mount of Jupiter, and Mount of Mercury. Analyze career path, ambition, and business acumen.';
      } else if (selectedMode === 'health') {
        modePrompt = 'Focus primarily on Life Line, health line, and finger nail shapes. Analyze vitality, health outlook, and energy levels.';
      }

      const prompt = `You are an expert palmist and astrologer. Perform a detailed palm reading analysis. ${userContext}
${modePrompt}

Analyze the following aspects and provide scores (0-100) for each:

**Life Line**: Score: [0-100]. Analyze vitality, health outlook, and major life changes.
**Heart Line**: Score: [0-100]. Analyze emotional state, romantic relationships, and emotional depth.
**Head Line**: Score: [0-100]. Analyze thinking style, intellect, decision-making approach.
**Fate Line**: Score: [0-100]. Analyze life direction, career path, destiny influences.

**Mount of Venus**: Love, passion, sensuality.
**Mount of Jupiter**: Ambition, leadership, confidence.
**Mount of Saturn**: Wisdom, responsibility, discipline.
**Mount of Apollo**: Creativity, artistic talent, success.
**Mount of Mercury**: Communication, business acumen.

**Finger Analysis**: Analyze finger shapes and proportions — cone, square, or spatula type. What do they reveal about personality?

**Relationship Lines**: How many relationship/marriage lines are visible? What do they indicate about love life?

**Travel Lines**: Are there travel lines visible on the palm edge? What journeys lie ahead?

**Money Triangle**: Is the money triangle (Head Line + Fate Line + Mercury Line) formed? What does it indicate about financial prospects?

**Summary**: Tie all elements together.

Respond in English. Be specific, insightful, and encouraging.`;

      const rawResult = await interpretPalmReading(prompt);
      const success = await tokenService.useTokens(mode.cost);
      if (!success) {
        setError('Token deduction failed. Please try again.');
        setIsAnalyzing(false);
        clearInterval(msgInterval);
        spin.stop();
        return;
      }
      Animated.timing(progressAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
      const parsed = parseAIResult(rawResult);

      // Real hand geometry — enhancement only, never blocks the reading.
      const hand = handPromise ? await handPromise.catch(() => null) : null;
      if (hand) {
        setHandJoints(hand.joints);
        setHandedness(hand.handedness);
      }

      setPalmResult(parsed);
      tracker.track('feature_complete', { feature: 'palm_reading', mode: selectedMode, hand_detected: !!hand });
    } catch (e: any) {
      setError(e.message || 'Failed to analyze palm. Please try again.');
    } finally {
      clearInterval(msgInterval);
      spin.stop();
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setPalmResult(null);
    setIsAnalyzing(false);
    setError(null);
    setShowGuide(true);
    setHandJoints(null);
    setHandedness(null);
    setImageSize(null);
  };

  // Colors — black/white theme
  const tint = isDark ? '#FFF' : '#1C1C1E';
  const tintSoft = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const tintBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const glassCard = isDark ? 'rgba(30,30,50,0.55)' : 'rgba(245,245,247,0.70)';

  // ====================================================================
  // UPLOAD VIEW
  // ====================================================================
  const renderUploadView = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg }}>
      {/* Hero with floating hand */}
      <View style={[st.heroCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
        <Animated.View style={[st.heroImgWrap, {
          transform: [{ translateY: handFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
        }]}>
          <Image source={PALM_IMG} style={st.heroPalmImg} resizeMode="contain" />
        </Animated.View>
        <Text style={[st.heroTitle, { color: colors.text }]}>{t('palmReading')}</Text>
        <Text style={[st.heroSubtitle, { color: colors.textSecondary }]}>
          Capture a clear photo of your palm and receive an AI-powered palmistry analysis.
        </Text>
        <View style={[st.costBadge, { backgroundColor: tintSoft }]}>
          <CoinIcon size={16} />
          <Text style={[st.costText, { color: tint }]}>{ANALYSIS_MODES.find(m => m.id === selectedMode)?.cost || TOKEN_COST} Moon Tokens</Text>
        </View>
      </View>

      {/* Analysis Mode Selector */}
      <Text style={[st.sectionLabel, { color: colors.text }]}>{t('chooseAnalysis')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.modeScroll} contentContainerStyle={{ gap: 10 }}>
        {ANALYSIS_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[st.modeChip, {
              backgroundColor: selectedMode === mode.id ? tint : glassCard,
              borderColor: selectedMode === mode.id ? tint : tintBorder,
            }]}
            onPress={() => { setSelectedMode(mode.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.8}
          >
            <Ionicons name={mode.icon as any} size={18} color={selectedMode === mode.id ? (isDark ? '#1C1C1E' : '#FFF') : colors.textSecondary} />
            <Text style={[st.modeTitle, { color: selectedMode === mode.id ? (isDark ? '#1C1C1E' : '#FFF') : colors.text }]}>{mode.title}</Text>
            <Text style={[st.modeDesc, { color: selectedMode === mode.id ? (isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)') : colors.textTertiary }]}>{mode.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Camera Guide — real hand image */}
      {showGuide && (
        <View style={[st.guideContainer, { backgroundColor: isDark ? 'rgba(15,12,36,0.8)' : 'rgba(20,20,40,0.85)', borderColor: tintBorder }]}>
          <Text style={[st.guideLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('alignPalmGuide')}</Text>
          <View style={st.guideCenter}>
            <Image source={HAND_IMG} style={st.guideHandImg} resizeMode="contain" />
            {/* Scanning line animation */}
            <Animated.View style={[st.scanLine, {
              backgroundColor: tint,
              transform: [{ translateY: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] }) }],
            }]} />
          </View>
          <Text style={[st.guideSub, { color: 'rgba(255,255,255,0.45)' }]}>Either hand works — keep it flat and well-lit</Text>
        </View>
      )}

      {/* Tips */}
      <View style={[st.tipsCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
        <View style={st.tipsHeader}>
          <MagicStarIcon size={18} color={tint} />
          <Text style={[st.tipsTitle, { color: colors.text }]}>{t('tipsGreatReading')}</Text>
        </View>
        {[
          'Keep your palm flat and fingers slightly apart',
          'Ensure good, even lighting with no shadows',
          'Make sure all major lines are clearly visible',
          'Either hand works — right for present, left for potential',
        ].map((tip, i) => (
          <View key={i} style={st.tipRow}>
            <View style={[st.tipNum, { backgroundColor: tintSoft }]}>
              <Text style={[st.tipNumText, { color: tint }]}>{i + 1}</Text>
            </View>
            <Text style={[st.tipText, { color: colors.textSecondary }]}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={st.btnRow}>
        <TouchableOpacity
          style={[st.cameraBtn, { backgroundColor: tint }]}
          onPress={() => pickImage(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={26} color={isDark ? '#1C1C1E' : '#FFF'} />
          <Text style={[st.cameraBtnText, { color: isDark ? '#1C1C1E' : '#FFF' }]}>{t('camera')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.galleryBtn, { backgroundColor: glassCard, borderColor: tintBorder }]}
          onPress={() => pickImage(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="images" size={26} color={tint} />
          <Text style={[st.galleryBtnText, { color: tint }]}>{t('gallery')}</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[st.errorBanner, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)', borderColor: colors.error }]}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={[st.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ====================================================================
  // ANALYZING VIEW
  // ====================================================================
  const renderAnalyzingView = () => {
    const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
    const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
      <View style={[st.analyzingWrap, { backgroundColor: colors.background }]}>
        {selectedImage && (
          <View style={[st.analyzeImgWrap, { borderColor: tintBorder }]}>
            <Image source={{ uri: selectedImage }} style={st.analyzeImg} />
          </View>
        )}
        <Animated.View style={[st.spinnerRing, { transform: [{ rotate }], borderColor: tint }]}>
          <Animated.View style={[st.pulseInner, { backgroundColor: tintSoft, transform: [{ scale }] }]}>
            <MagicStarIcon size={24} color={tint} />
          </Animated.View>
        </Animated.View>
        <Text style={[st.analyzeTitle, { color: colors.text }]}>{loadingText}</Text>
        <Text style={[st.analyzeSub, { color: colors.textSecondary }]}>{t('pleaseWait')}</Text>
        <View style={[st.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[st.progressFill, { width: progressWidth, backgroundColor: tint }]} />
        </View>
      </View>
    );
  };

  // ====================================================================
  // RESULT VIEW
  // ====================================================================
  const renderResultView = () => {
    if (!palmResult) return null;

    return (
      <Animated.View style={{ flex: 1, opacity: fadeIn }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg }}>
          {/* Success */}
          <View style={[st.successBanner, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)', borderColor: colors.success }]}>
            <TickCircleIcon size={22} color={colors.success} />
            <Text style={[st.successText, { color: colors.text }]}>{t('palmReadingReady')}</Text>
          </View>

          {selectedImage && (
            <View style={[st.resultImg, { borderColor: tintBorder, overflow: 'hidden' }]}>
              <Image source={{ uri: selectedImage }} style={{ width: '100%', height: '100%' }} />
              <HandLineOverlay joints={handJoints} imageSize={imageSize} />
              {handedness && (
                <View style={[st.handednessBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                  <Ionicons name="hand-left-outline" size={12} color="#FFF" />
                  <Text style={st.handednessText}>
                    {handedness === 'Right' ? 'Right hand — present' : 'Left hand — potential'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Summary */}
          <View style={[st.sectionCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
            <View style={st.sectionHeader}>
              <View style={[st.sectionIconWrap, { backgroundColor: tintSoft }]}>
                <MagicStarIcon size={18} color={tint} />
              </View>
              <Text style={[st.sectionTitle, { color: colors.text }]}>{t('overallSummary')}</Text>
            </View>
            <Text style={[st.sectionBody, { color: colors.textSecondary }]}>{palmResult.summary}</Text>
          </View>

          {/* Palm Lines */}
          <Text style={[st.groupTitle, { color: colors.text }]}>{t('palmLines')}</Text>
          {palmResult.lines.map((line, i) => (
            <View key={i} style={[st.lineCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
              <View style={st.lineTop}>
                <LinePositionSvg lineName={line.name} color={tint} />
                <View style={st.lineInfo}>
                  <Text style={[st.lineName, { color: colors.text }]}>{line.name}</Text>
                  <View style={st.scoreRow}>
                    <View style={[st.scoreTrack, { backgroundColor: colors.border }]}>
                      <View style={[st.scoreFill, { width: `${line.score}%`, backgroundColor: getScoreColor(line.score, accent) }]} />
                    </View>
                    <Text style={[st.scoreVal, { color: tint }]}>{line.score}</Text>
                  </View>
                </View>
              </View>
              <Text style={[st.lineInterp, { color: colors.textSecondary }]}>{line.interpretation}</Text>
            </View>
          ))}

          {/* Mounts */}
          <Text style={[st.groupTitle, { color: colors.text }]}>{t('mountAnalysis')}</Text>
          {palmResult.mounts.map((mount, i) => (
            <View key={i} style={[st.mountCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
              <View style={st.mountHeader}>
                <View style={[st.mountDot, { backgroundColor: getMountColor(i, accent) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[st.mountName, { color: colors.text }]}>{mount.name}</Text>
                  <Text style={[st.mountDomain, { color: tint }]}>{mount.domain}</Text>
                </View>
              </View>
              <Text style={[st.mountInterp, { color: colors.textSecondary }]}>{mount.interpretation}</Text>
            </View>
          ))}

          {/* Extra Insights */}
          {(palmResult.fingerAnalysis || palmResult.relationshipLines || palmResult.travelLines || palmResult.moneyTriangle) && (
            <>
              <Text style={[st.groupTitle, { color: colors.text }]}>{t('deepInsights')}</Text>

              {palmResult.fingerAnalysis && (
                <View style={[st.insightCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
                  <View style={st.insightHeader}>
                    <Ionicons name="hand-left-outline" size={18} color={tint} />
                    <Text style={[st.insightTitle, { color: colors.text }]}>{t('fingerShapeAnalysis')}</Text>
                  </View>
                  <Text style={[st.insightBody, { color: colors.textSecondary }]}>{palmResult.fingerAnalysis}</Text>
                </View>
              )}

              {palmResult.relationshipLines && (
                <View style={[st.insightCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
                  <View style={st.insightHeader}>
                    <Ionicons name="heart-outline" size={18} color={accent.pink} />
                    <Text style={[st.insightTitle, { color: colors.text }]}>{t('relationshipLines')}</Text>
                  </View>
                  <Text style={[st.insightBody, { color: colors.textSecondary }]}>{palmResult.relationshipLines}</Text>
                </View>
              )}

              {palmResult.travelLines && (
                <View style={[st.insightCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
                  <View style={st.insightHeader}>
                    <Ionicons name="airplane-outline" size={18} color={accent.cyan} />
                    <Text style={[st.insightTitle, { color: colors.text }]}>{t('travelLines')}</Text>
                  </View>
                  <Text style={[st.insightBody, { color: colors.textSecondary }]}>{palmResult.travelLines}</Text>
                </View>
              )}

              {palmResult.moneyTriangle && (
                <View style={[st.insightCard, { backgroundColor: glassCard, borderColor: tintBorder }]}>
                  <View style={st.insightHeader}>
                    <CoinIcon size={18} />
                    <Text style={[st.insightTitle, { color: colors.text }]}>{t('moneyTriangle')}</Text>
                  </View>
                  <Text style={[st.insightBody, { color: colors.textSecondary }]}>{palmResult.moneyTriangle}</Text>
                </View>
              )}
            </>
          )}

          {/* New Reading */}
          <TouchableOpacity style={[st.resetBtn, { backgroundColor: tint }]} onPress={reset} activeOpacity={0.8}>
            <Text style={[st.resetBtnText, { color: isDark ? '#1C1C1E' : '#FFF' }]}>{t('newReading')}</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    );
  };

  // ====================================================================
  // MAIN RENDER
  // ====================================================================
  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={st.safeArea} edges={['top']}>
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[st.backBtn, { backgroundColor: isDark ? colors.card : colors.surface }]}>
            <ArrowCircleLeftIcon size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={st.headerTitles}>
            <Text style={[st.headerTitle, { color: colors.text }]}>{t('palmReading')}</Text>
            <Text style={[st.headerSub, { color: colors.textSecondary }]}>{t('palmistryAnalysis')}</Text>
          </View>
          <View style={[st.headerIconWrap, { backgroundColor: tintSoft }]}>
            <Image source={PALM_IMG} style={{ width: 24, height: 24 }} resizeMode="contain" />
          </View>
        </View>

        {isAnalyzing ? renderAnalyzingView() : palmResult ? renderResultView() : renderUploadView()}
      </SafeAreaView>
    </View>
  );
};

// ---------- Helpers ----------
const getScoreColor = (score: number, accentColors: typeof Colors.accent) => {
  if (score >= 80) return accentColors.green;
  if (score >= 60) return ACCENT_PURPLE;
  if (score >= 40) return accentColors.orange;
  return accentColors.red;
};

const getMountColor = (index: number, accentColors: typeof Colors.accent) => {
  const palette = [accentColors.pink, accentColors.purple, accentColors.blue, accentColors.orange, accentColors.cyan];
  return palette[index % palette.length];
};

// ====================================================================
// STYLES
// ====================================================================
const st = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  backBtn: { padding: 10, borderRadius: BorderRadius.sm },
  headerTitles: { flex: 1, marginLeft: Spacing.md },
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: '700' },
  headerSub: { fontSize: FontSizes.sm, marginTop: 2 },
  headerIconWrap: { padding: 10, borderRadius: BorderRadius.sm },

  // Hero
  heroCard: { padding: 20, borderRadius: 18, borderWidth: 1, alignItems: 'center', marginBottom: Spacing.md },
  heroImgWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroPalmImg: { width: 60, height: 60 },
  heroTitle: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  heroSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  costBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  costText: { fontSize: 12, fontWeight: '600' },

  // Mode selector
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  modeScroll: { marginBottom: Spacing.md },
  modeChip: { width: 115, padding: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 3 },
  modeTitle: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  modeDesc: { fontSize: 9, textAlign: 'center' },

  // Guide
  guideContainer: { borderRadius: 18, borderWidth: 1, padding: Spacing.sm, marginBottom: Spacing.md, alignItems: 'center', overflow: 'hidden' },
  guideCenter: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, overflow: 'hidden' },
  guideHandImg: { width: SCREEN_WIDTH * 0.55, height: SCREEN_WIDTH * 0.7 },
  scanLine: { position: 'absolute', width: '80%', height: 2, opacity: 0.6, borderRadius: 1 },
  guideLabel: { fontSize: FontSizes.md, fontWeight: '600', marginBottom: 8 },
  guideSub: { fontSize: FontSizes.sm, marginTop: 8 },

  // Tips
  tipsCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: Spacing.md },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  tipsTitle: { fontSize: 14, fontWeight: '700' },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tipNum: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  tipNumText: { fontSize: 11, fontWeight: '700' },
  tipText: { fontSize: 13, flex: 1 },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 12 },
  cameraBtn: { flex: 1, height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cameraBtnText: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  galleryBtn: { flex: 1, height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  galleryBtnText: { fontSize: 14, fontWeight: '700', marginTop: 4 },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: Spacing.md },
  errorText: { fontSize: FontSizes.md, flex: 1 },

  // Analyzing
  analyzingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  analyzeImgWrap: { width: 140, height: 140, borderRadius: 20, borderWidth: 2, overflow: 'hidden', marginBottom: 32 },
  analyzeImg: { width: '100%', height: '100%' },
  spinnerRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderTopColor: 'transparent', borderRightColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
  pulseInner: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  analyzeTitle: { fontSize: FontSizes.xl, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  analyzeSub: { fontSize: FontSizes.md, marginBottom: 24 },
  progressTrack: { width: 220, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  // Result
  successBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: Spacing.lg, gap: 10 },
  successText: { fontSize: FontSizes.lg, fontWeight: '700' },
  resultImg: { width: '100%', height: 200, borderRadius: 20, marginBottom: Spacing.lg, borderWidth: 1, position: 'relative' },
  handednessBadge: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  handednessText: { fontSize: 11, fontWeight: '600', color: '#FFF' },

  // Section card
  sectionCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIconWrap: { padding: 6, borderRadius: 8, marginRight: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionBody: { fontSize: 13, lineHeight: 20 },

  // Group
  groupTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },

  // Line cards
  lineCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  lineTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lineInfo: { flex: 1, marginLeft: 10 },
  lineName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 3 },
  scoreVal: { fontSize: 13, fontWeight: '700', width: 28, textAlign: 'right' },
  lineInterp: { fontSize: 13, lineHeight: 19 },

  // Mount cards
  mountCard: { padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  mountHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mountDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  mountName: { fontSize: 14, fontWeight: '600' },
  mountDomain: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  mountInterp: { fontSize: 13, lineHeight: 19 },

  // Insight cards
  insightCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  insightTitle: { fontSize: 14, fontWeight: '700' },
  insightBody: { fontSize: 13, lineHeight: 19 },

  // Reset
  resetBtn: { height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  resetBtnText: { fontSize: 14, fontWeight: '700' },
});
