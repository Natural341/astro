// Tarot Reading Screen — Modern Mystic Design with Real Card Images
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagicStarIcon, AddCircleIcon, ArrowCircleLeftIcon, CoinIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import Svg, { Polygon } from 'react-native-svg';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { chatWithAI } from '../services/geminiService';
import { tracker } from '../services/eventTracker';
import { majorArcana } from '../data/tarotCards';
import { getCardImage } from '../data/tarotImages';
import { Spacing } from '../config/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Card sizes
const CARD_WIDTH = (SCREEN_W - 72) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.7;
const GRID_CARD_WIDTH = (SCREEN_W - 56) / 5 - 6;
const GRID_CARD_HEIGHT = GRID_CARD_WIDTH * 1.6;
const SLOT_W = CARD_WIDTH * 0.6;
const SLOT_H = SLOT_W * 1.7;
const TOKEN_COST = 20;

// Tarot card back image
const CARD_BACK_IMG = require('../../tarotb.png');

// English card data
const TAROT_DECK = majorArcana.map((card) => ({
  id: card.id,
  name: card.nameEn,
  number: toRoman(card.id),
  arcana: card.arcana,
  suit: card.suit,
  cardNumber: card.number ?? card.id,
  meaningUpright: card.meaningUpright,
  meaningReversed: card.meaningReversed,
  keywords: card.keywords,
}));

function toRoman(num: number): string {
  const map: [number, string][] = [
    [21, 'XXI'], [20, 'XX'], [19, 'XIX'], [18, 'XVIII'], [17, 'XVII'],
    [16, 'XVI'], [15, 'XV'], [14, 'XIV'], [13, 'XIII'], [12, 'XII'],
    [11, 'XI'], [10, 'X'], [9, 'IX'], [8, 'VIII'], [7, 'VII'],
    [6, 'VI'], [5, 'V'], [4, 'IV'], [3, 'III'], [2, 'II'], [1, 'I'], [0, '0'],
  ];
  for (const [value, numeral] of map) {
    if (num === value) return numeral;
  }
  return String(num);
}

const POSITIONS = [
  { label: 'Past', desc: 'What has passed', icon: '◐' },
  { label: 'Present', desc: 'Current energy', icon: '◉' },
  { label: 'Future', desc: 'What is to come', icon: '◑' },
];

// ─── Card Back using tarotb.png ────────────────────────────────────────────
const CardBackImage: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <View style={{ width: w, height: h, borderRadius: 10, overflow: 'hidden' }}>
    <Image source={CARD_BACK_IMG} style={{ width: w, height: h }} resizeMode="cover" />
  </View>
);

// ─── Random scatter positions for dealing animation (from center, all directions) ──
const generateScatterData = (count: number) =>
  Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 200;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * 0.6,
      rotate: (Math.random() - 0.5) * 180,
      startScale: 0.3 + Math.random() * 0.4,
    };
  });

export const TarotScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, removeTokens } = useStore();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  // Translated position labels for display (POSITIONS stays English for the AI prompt)
  const POS_T = [
    { label: t('posPast'), desc: t('posPastDesc') },
    { label: t('posPresent'), desc: t('posPresentDesc') },
    { label: t('posFuture'), desc: t('posFutureDesc') },
  ];

  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [revealedCards, setRevealedCards] = useState<typeof TAROT_DECK>([]);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [dealingDone, setDealingDone] = useState(false);

  // Theme-aware accent palette
  const purple = isDark ? '#9D4EDD' : '#7B2CBF';
  const gold = '#C9A84C';
  const surface = isDark ? '#13112A' : colors.surface;
  const cardSurface = isDark ? '#18162E' : colors.card;
  const glowPurple = `${purple}30`;

  // Flip animations for reveal
  const flipAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Dealing animation: each card has an animated value 0→1 (scattered → grid)
  const scatterData = useRef(generateScatterData(TAROT_DECK.length)).current;
  const dealAnims = useRef(TAROT_DECK.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    tracker.track('screen_view', { screen: 'Tarot' });
    // Stagger dealing animation
    const staggered = dealAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 40,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      })
    );
    Animated.stagger(40, staggered).start(() => setDealingDone(true));
  }, []);

  const selectCard = useCallback((index: number) => {
    if (selectedCards.length >= 3 || selectedCards.includes(index)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCards((prev) => [...prev, index]);
  }, [selectedCards]);

  const revealCards = async () => {
    if (selectedCards.length < 3) return;
    const hasTokens = removeTokens(TOKEN_COST);
    if (!hasTokens) { setTokenError(true); return; }
    setTokenError(false);
    setIsRevealing(true);

    const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);
    setRevealedCards(picked);

    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 500));
      Animated.timing(flipAnims[i], {
        toValue: 1, duration: 700, useNativeDriver: true,
      }).start();
    }

    await new Promise((r) => setTimeout(r, 400));
    setIsRevealing(false);
    setShowReading(true);
    getAIInterpretation(picked);
  };

  const getAIInterpretation = async (cards: typeof TAROT_DECK) => {
    setIsLoadingAI(true);
    try {
      tracker.track('feature_tap', { feature: 'tarot' });
      const cardsText = cards
        .map((c, i) => `${POSITIONS[i].label}: ${c.name} (${c.number}) - Upright: ${c.meaningUpright}`)
        .join('\n');
      const userCtx = user
        ? `The querent's name is ${user.name || 'unknown'}, zodiac sign: ${user.zodiacSign || 'unknown'}.`
        : '';
      const prompt = `Perform a tarot reading. The drawn cards are:\n\n${cardsText}\n\n${userCtx}\n\nExplain what these three cards mean together, the connections between them, and their possible reflections on the person's life. Write 3-4 paragraphs in a mystical but understandable language. Respond in English.`;
      const response = await chatWithAI(
        prompt,
        'You are an experienced Tarot reader. You deeply understand the Major Arcana and their symbolic meanings. Provide insightful, compassionate readings.'
      );
      setAiInterpretation(response);
      tracker.track('feature_complete', { feature: 'tarot' });
    } catch {
      setAiInterpretation('An error occurred while loading the interpretation. Please try again.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const resetReading = () => {
    setSelectedCards([]);
    setShowReading(false);
    setRevealedCards([]);
    setAiInterpretation('');
    setTokenError(false);
    flipAnims.forEach((a) => a.setValue(0));
  };

  // --- Card Front with real image ---
  const renderCardFront = (card: (typeof TAROT_DECK)[0], cardW: number, cardH: number) => {
    const img = getCardImage({ arcana: card.arcana as 'major' | 'minor', suit: card.suit, number: card.cardNumber });
    return (
      <View style={[s.cardOuter, { width: cardW, height: cardH, backgroundColor: cardSurface, borderColor: `${gold}50` }]}>
        {img ? (
          <Image source={img} style={{ width: cardW - 3, height: cardH - 3, borderRadius: 9 }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: gold, fontWeight: '700', fontSize: 14 }}>{card.number}</Text>
            <Text style={{ color: colors.text, fontSize: 11, marginTop: 4, textAlign: 'center' }} numberOfLines={2}>{card.name}</Text>
          </View>
        )}
      </View>
    );
  };

  // ======================== SELECTION VIEW ========================
  const renderSelectionView = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Position slots - moved up, no hero section */}
      <View style={s.slotsRow}>
        {POSITIONS.map((pos, idx) => {
          const filled = selectedCards.length > idx;
          return (
            <View key={idx} style={s.slotWrap}>
              <View style={[
                s.slotCard,
                { width: SLOT_W, height: SLOT_H, borderColor: filled ? purple : colors.border },
                filled && { borderColor: purple, shadowColor: purple, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
              ]}>
                {filled ? (
                  <CardBackImage w={SLOT_W - 4} h={SLOT_H - 4} />
                ) : (
                  <View style={s.slotEmpty}>
                    <AddCircleIcon size={22} color={colors.textTertiary} />
                    <Text style={[s.slotEmptyNum, { color: colors.textTertiary }]}>{idx + 1}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.slotLabel, { color: filled ? purple : colors.textSecondary }]}>{POS_T[idx].label}</Text>
              <Text style={[s.slotDesc, { color: colors.textTertiary }]}>{POS_T[idx].desc}</Text>
            </View>
          );
        })}
      </View>

      {/* Token cost badge */}
      <View style={[s.tokenCostBadge, { backgroundColor: `${purple}12`, borderColor: `${purple}25` }]}>
        <MagicStarIcon size={14} color={gold} />
        <Text style={[s.tokenCostText, { color: colors.textSecondary }]}>{TOKEN_COST} {t('moonTokens')}</Text>
      </View>

      {tokenError && (
        <Text style={[s.errorText, { color: colors.error }]}>
          {t('notEnoughTokensPremium')}
        </Text>
      )}

      {/* Reveal button or grid */}
      {selectedCards.length === 3 ? (
        <TouchableOpacity
          style={[s.revealBtn, { backgroundColor: purple }]}
          onPress={revealCards}
          disabled={isRevealing}
          activeOpacity={0.8}
        >
          {isRevealing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MagicStarIcon size={20} color="#FFF" />
              <Text style={s.revealBtnText}>{t('revealReading')}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <Text style={[s.pickPrompt, { color: purple }]}>
            {t('tapCardsPre')} {3 - selectedCards.length} {t('tapCardsPost')}
          </Text>

          {/* Card grid with dealing animation */}
          <View style={s.grid}>
            {TAROT_DECK.map((_, idx) => {
              const picked = selectedCards.includes(idx);
              const scatter = scatterData[idx];
              const anim = dealAnims[idx];

              const translateX = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [scatter.x, 0],
              });
              const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [scatter.y, 0],
              });
              const rotate = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [`${scatter.rotate}deg`, '0deg'],
              });
              const scale = anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [scatter.startScale, 1.08, 1],
              });
              const opacity = anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 1],
              });

              return picked ? (
                <Animated.View key={idx} style={[s.gridItem, {
                  width: GRID_CARD_WIDTH, height: GRID_CARD_HEIGHT,
                  opacity: 0.15,
                  transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }, { scale: 1 }],
                }]}>
                  <CardBackImage w={GRID_CARD_WIDTH} h={GRID_CARD_HEIGHT} />
                </Animated.View>
              ) : (
                <Animated.View key={idx} style={{
                  opacity,
                  transform: [{ translateX }, { translateY }, { rotate }, { scale }],
                }}>
                  <TouchableOpacity
                    style={[s.gridItem, { width: GRID_CARD_WIDTH, height: GRID_CARD_HEIGHT }]}
                    onPress={() => dealingDone && selectCard(idx)}
                    activeOpacity={0.7}
                  >
                    <CardBackImage w={GRID_CARD_WIDTH} h={GRID_CARD_HEIGHT} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );

  // ======================== READING VIEW ========================
  const renderReadingView = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

      {/* Spread title */}
      <View style={s.spreadHeader}>
        <View style={[s.spreadLine, { backgroundColor: `${gold}30` }]} />
        <Text style={[s.spreadTitle, { color: gold }]}>{t('yourSpread')}</Text>
        <View style={[s.spreadLine, { backgroundColor: `${gold}30` }]} />
      </View>

      {/* Revealed cards row */}
      <View style={s.revealRow}>
        {revealedCards.map((card, idx) => {
          const frontRotateY = flipAnims[idx].interpolate({
            inputRange: [0, 0.5, 1], outputRange: ['180deg', '90deg', '0deg'],
          });
          const backRotateY = flipAnims[idx].interpolate({
            inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '180deg'],
          });
          const frontOpacity = flipAnims[idx].interpolate({
            inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1],
          });
          const backOpacity = flipAnims[idx].interpolate({
            inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0],
          });

          return (
            <View key={idx} style={s.revealCardWrap}>
              {/* Back */}
              <Animated.View style={[s.revealCardAbs, {
                width: CARD_WIDTH, height: CARD_HEIGHT,
                transform: [{ perspective: 1000 }, { rotateY: backRotateY }],
                opacity: backOpacity,
              }]}>
                <CardBackImage w={CARD_WIDTH} h={CARD_HEIGHT} />
              </Animated.View>
              {/* Front */}
              <Animated.View style={[s.revealCardAbs, {
                width: CARD_WIDTH, height: CARD_HEIGHT,
                transform: [{ perspective: 1000 }, { rotateY: frontRotateY }],
                opacity: frontOpacity,
                shadowColor: purple, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
              }]}>
                {renderCardFront(card, CARD_WIDTH, CARD_HEIGHT)}
              </Animated.View>
              {/* Layout spacer */}
              <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} />
              {/* Position label - high contrast, readable */}
              <View style={[s.posLabelBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                <Text style={[s.posLabelText, { color: colors.text }]}>{POS_T[idx].label}</Text>
              </View>
              <Text style={[s.posLabelDesc, { color: colors.textSecondary }]}>{POS_T[idx].desc}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Individual card details ── */}
      {revealedCards.map((card, idx) => {
        const img = getCardImage({ arcana: card.arcana as 'major' | 'minor', suit: card.suit, number: card.cardNumber });
        return (
          <View key={idx} style={[s.detailCard, {
            backgroundColor: isDark ? 'rgba(19,17,42,0.75)' : 'rgba(255,255,255,0.85)',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }]}>
            {/* Position tag */}
            <View style={[s.detailPosTag, { backgroundColor: idx === 0 ? '#3B82F6' : idx === 1 ? purple : '#F59E0B' }]}>
              <Text style={s.detailPosTagText}>{POS_T[idx].label}</Text>
            </View>

            {/* Card header with thumbnail */}
            <View style={s.detailHeader}>
              {img && (
                <View style={[s.detailThumbWrap, { borderColor: `${gold}30` }]}>
                  <Image source={img} style={s.detailThumb} resizeMode="cover" />
                </View>
              )}
              <View style={s.detailHeaderText}>
                <Text style={[s.detailName, { color: colors.text }]}>{card.name}</Text>
                <Text style={[s.detailNumber, { color: gold }]}>{card.number} - Major Arcana</Text>
              </View>
            </View>

            {/* Meanings in two columns */}
            <View style={s.meaningColumns}>
              <View style={[s.meaningCol, { backgroundColor: isDark ? 'rgba(157,78,221,0.08)' : 'rgba(157,78,221,0.05)', borderColor: isDark ? 'rgba(157,78,221,0.15)' : 'rgba(157,78,221,0.1)' }]}>
                <Text style={[s.meaningLabel, { color: colors.text }]}>{t('upright')}</Text>
                <Text style={[s.meaningText, { color: colors.textSecondary }]}>{card.meaningUpright}</Text>
              </View>
              <View style={[s.meaningCol, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[s.meaningLabel, { color: colors.textSecondary }]}>{t('reversed')}</Text>
                <Text style={[s.meaningText, { color: colors.textTertiary }]}>{card.meaningReversed}</Text>
              </View>
            </View>

            {/* Keywords */}
            <View style={s.kwRow}>
              {card.keywords.map((kw, ki) => (
                <View key={ki} style={[s.kwChip, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }]}>
                  <Text style={[s.kwText, { color: colors.text }]}>{kw}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* ── Combined Cosmic Interpretation ── */}
      <View style={[s.aiCard, {
        backgroundColor: isDark ? 'rgba(19,17,42,0.75)' : 'rgba(255,255,255,0.85)',
        borderColor: isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.08)',
      }]}>
        <View style={s.aiHeader}>
          <View style={[s.aiIconWrap, { backgroundColor: `${purple}15` }]}>
            <MagicStarIcon size={20} color={gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.aiTitle, { color: colors.text }]}>{t('combinedReading')}</Text>
            <Text style={[s.aiSubtitle, { color: colors.textTertiary }]}>{t('howCardsConnect')}</Text>
          </View>
        </View>
        {isLoadingAI ? (
          <View style={s.aiLoading}>
            <ActivityIndicator color={purple} size="small" />
            <Text style={[s.aiLoadingText, { color: colors.textSecondary }]}>
              Reading the cosmic patterns...
            </Text>
          </View>
        ) : (
          <Text style={[s.aiBody, { color: colors.text }]}>{aiInterpretation}</Text>
        )}
      </View>

      {/* New Reading button */}
      <TouchableOpacity
        style={[s.newReadingBtn, { backgroundColor: purple }]}
        onPress={resetReading}
        activeOpacity={0.7}
      >
        <Text style={s.newReadingBtnText}>{t('drawNewCards')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ======================== MAIN RENDER ========================
  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Decorative background orbs */}
      <View style={[s.bgOrb1, { backgroundColor: `${purple}08` }]} />
      <View style={[s.bgOrb2, { backgroundColor: `${gold}06` }]} />
      <View style={[s.bgOrb3, { backgroundColor: `${purple}05` }]} />

      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header - back button left, token badge right */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: surface, borderColor: `${purple}12`, borderWidth: 1 }]} activeOpacity={0.7}>
            <ArrowCircleLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Center star icon */}
          <View style={[s.headerCenter, { backgroundColor: `${purple}12`, borderColor: `${gold}20`, borderWidth: 1 }]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Polygon points="12,2 14.5,9 22,9 16,14 18.5,22 12,17 5.5,22 8,14 2,9 9.5,9" fill="none" stroke={gold} strokeWidth="1.5" />
            </Svg>
          </View>

          {/* Token badge - tappable → Premium */}
          <TouchableOpacity
            style={[s.tokenBadge, { backgroundColor: isDark ? '#252535' : '#F8F9FA', borderColor: `${gold}30` }]}
            onPress={() => navigation.navigate('Premium')}
            activeOpacity={0.7}
          >
            <CoinIcon size={22} />
            <Text style={[s.tokenBadgeText, { color: gold }]}>{user?.tokens || 0}</Text>
          </TouchableOpacity>
        </View>

        {showReading ? renderReadingView() : renderSelectionView()}
      </SafeAreaView>
    </View>
  );
};

// ======================== STYLES ========================
const s = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1 },

  // Background decorative orbs
  bgOrb1: { position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120 },
  bgOrb2: { position: 'absolute', bottom: 100, left: -80, width: 200, height: 200, borderRadius: 100 },
  bgOrb3: { position: 'absolute', top: 350, right: -40, width: 160, height: 160, borderRadius: 80 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  backBtn: { padding: 10, borderRadius: 14 },
  headerCenter: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  tokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1,
  },
  tokenBadgeText: { fontSize: 14, fontWeight: '700' },

  // Slots - pushed up (no hero)
  slotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12, paddingHorizontal: Spacing.md },
  slotWrap: { alignItems: 'center' },
  slotCard: {
    borderRadius: 12, borderWidth: 2, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  slotEmpty: { alignItems: 'center', gap: 6 },
  slotEmptyNum: { fontSize: 11, fontWeight: '700' },
  slotLabel: { marginTop: 8, fontSize: 13, fontWeight: '700' },
  slotDesc: { fontSize: 10, marginTop: 2 },

  // Token cost badge (inline, below slots)
  tokenCostBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    gap: 6, marginTop: 16, paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1,
  },
  tokenCostText: { fontSize: 12, fontWeight: '600' },
  errorText: { textAlign: 'center', fontSize: 12, fontWeight: '500', marginTop: 8, paddingHorizontal: Spacing.lg },

  // Pick prompt
  pickPrompt: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 22, marginBottom: 16 },

  // Reveal button
  revealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: Spacing.lg, marginTop: 32, paddingVertical: 18,
    borderRadius: 16, shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  revealBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 7, paddingHorizontal: Spacing.sm,
  },
  gridItem: { borderRadius: 10, overflow: 'hidden' },

  // Card outer (front)
  cardOuter: { borderRadius: 10, borderWidth: 1.5, overflow: 'hidden' },

  // Reading - spread header
  spreadHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginTop: 8, marginBottom: 20, paddingHorizontal: Spacing.lg,
  },
  spreadLine: { flex: 1, height: 1 },
  spreadTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  // Revealed cards row
  revealRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 28, paddingHorizontal: 4 },
  revealCardWrap: { alignItems: 'center' },
  revealCardAbs: { position: 'absolute', borderRadius: 10, overflow: 'hidden' },

  // Position label badge - high contrast
  posLabelBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  posLabelText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  posLabelDesc: { fontSize: 10, marginTop: 3 },

  // Detail card - glassmorphism
  detailCard: {
    marginHorizontal: Spacing.lg, marginBottom: 16, borderRadius: 22,
    padding: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
  },
  detailPosTag: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, marginBottom: 14,
  },
  detailPosTagText: { color: '#FFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  detailHeader: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 16 },
  detailThumbWrap: { borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  detailThumb: { width: 62, height: 62 * 1.6, borderRadius: 10 },
  detailHeaderText: { flex: 1, gap: 4 },
  detailName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  detailNumber: { fontSize: 13, fontWeight: '600' },

  // Meanings - two column layout
  meaningColumns: { gap: 10, marginBottom: 14 },
  meaningCol: {
    borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  meaningLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  meaningText: { fontSize: 14, lineHeight: 22 },

  // Keywords
  kwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kwChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  kwText: { fontSize: 11, fontWeight: '600' },

  // AI Card - combined reading
  aiCard: {
    marginHorizontal: Spacing.lg, marginTop: 4, marginBottom: 8, borderRadius: 22,
    padding: 22, borderWidth: StyleSheet.hairlineWidth,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  aiIconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  aiTitle: { fontSize: 18, fontWeight: '800' },
  aiSubtitle: { fontSize: 12, marginTop: 2 },
  aiLoading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiLoadingText: { fontSize: 14 },
  aiBody: { fontSize: 15, lineHeight: 26 },

  // New Reading - solid button
  newReadingBtn: {
    marginHorizontal: Spacing.lg, marginTop: 20, paddingVertical: 16,
    borderRadius: 16, alignItems: 'center',
    shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  newReadingBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
