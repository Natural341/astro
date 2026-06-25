// Find Soulmate — "Meeting Forecast"
// Instead of "pick a zodiac → show a zodiac", this derives a soulmate MEETING
// forecast (when / where / how) from the user's own birth data. Fully deterministic
// (same user → same forecast) and backed by the real zodiac compatibility matrix.
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import {
  ArrowCircleLeftIcon,
  ConstellationIcon,
  HourglassIcon,
  CompassIcon,
  MoonIcon,
  HeartCircleIcon,
  SparklesIcon,
  InfoIcon,
  RefreshIcon,
  ShareIcon,
  AriesIcon, TaurusIcon, GeminiIcon, CancerIcon, LeoIcon, VirgoIcon,
  LibraIcon, ScorpioIcon, SagittariusIcon, CapricornIcon, AquariusIcon, PiscesIcon,
} from '../components/icons';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { getZodiacInfo } from '../utils/zodiac';
import {
  getCompatibility,
  ZODIAC_SIGNS,
  ZodiacSignName,
} from '../data/zodiacCompatibility';
import { Spacing, BorderRadius, FontSizes } from '../config/theme';

const ALL_SIGNS = Object.keys(ZODIAC_SIGNS) as ZodiacSignName[];

const SIGN_ICON: Record<ZodiacSignName, React.FC<{ size?: number; color?: string }>> = {
  Aries: AriesIcon, Taurus: TaurusIcon, Gemini: GeminiIcon, Cancer: CancerIcon,
  Leo: LeoIcon, Virgo: VirgoIcon, Libra: LibraIcon, Scorpio: ScorpioIcon,
  Sagittarius: SagittariusIcon, Capricorn: CapricornIcon, Aquarius: AquariusIcon, Pisces: PiscesIcon,
};

const ELEMENT_BLURB: Record<string, string> = {
  Fire: 'warm, bold and magnetic — someone who pulls you into motion',
  Earth: 'grounded, dependable and patient — someone who builds with you',
  Air: 'curious, communicative and light — someone who keeps your mind alive',
  Water: 'deep, intuitive and tender — someone who feels you without words',
};

const SETTINGS = [
  { title: 'Through a mutual friend', detail: 'A trusted connection quietly brings you into the same room.' },
  { title: 'At work or while studying', detail: 'The encounter hides inside your daily routine, in plain sight.' },
  { title: 'While traveling', detail: 'A change of scenery opens a door you were not looking for.' },
  { title: 'Through a shared interest', detail: 'A hobby or community thread becomes something far more real.' },
  { title: 'At a celebration', detail: 'A gathering draws you both into the same orbit at the right moment.' },
  { title: 'Somewhere familiar, unexpectedly', detail: 'A place you already know surprises you when you least expect it.' },
];

const SCENES = [
  'A small, ordinary moment — a shared glance, a held door, a coincidence — will feel strangely significant. Trust it.',
  'You will notice them through something they say, not how they look. A sentence will stay with you long after.',
  'The first meeting will feel oddly easy, like continuing a conversation you never started. Lean in.',
  'Timing will do the work. You will both be slightly out of your usual pattern — and that is exactly why it happens.',
  'A brief, almost forgettable encounter will quietly replay in your mind. That replay is the signal.',
];

const ADVICE = [
  'Stay open in the ordinary places. The cosmos rarely announces itself loudly.',
  'Say yes to the invitation you would normally decline — that is where the thread begins.',
  'Do not force the timeline. Your job is to be present, not to chase.',
  'Let curiosity lead. The right person will feel like relief, not effort.',
];

const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn'];
const seasonOf = (month0: number): string => {
  if (month0 === 11 || month0 <= 1) return SEASONS[0];
  if (month0 <= 4) return SEASONS[1];
  if (month0 <= 7) return SEASONS[2];
  return SEASONS[3];
};

const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const normalizeSign = (raw?: string): ZodiacSignName | null => {
  if (!raw) return null;
  const cap = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return (ALL_SIGNS as string[]).includes(cap) ? (cap as ZodiacSignName) : null;
};

interface Forecast {
  partnerSign: ZodiacSignName;
  partnerHints: ZodiacSignName[];
  element: string;
  elementBlurb: string;
  whenLabel: string;
  whenSub: string;
  setting: { title: string; detail: string };
  scene: string;
  advice: string;
  score: number;
  loveScore: number;
  keywords: string[];
}

const buildForecast = (sign: ZodiacSignName, seedKey: string): Forecast => {
  const seed = hashStr(`${sign}|${seedKey}`);

  // Rank all signs by romantic compatibility with the user's sign (real matrix).
  const ranked = ALL_SIGNS
    .filter((s) => s !== sign)
    .map((s) => ({ s, c: getCompatibility(sign, s) }))
    .sort((a, b) => b.c.loveScore - a.c.loveScore);

  const topPool = ranked.slice(0, 4);
  const primary = topPool[seed % topPool.length];
  const partnerSign = primary.s;
  const partnerHints = ranked.slice(0, 2).map((r) => r.s);
  const element = ZODIAC_SIGNS[partnerSign].element;

  // Deterministic "when" relative to today (real device date is fine here).
  const now = new Date();
  const monthsAhead = 2 + (seed % 6); // 2–7 months
  const target = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);
  const whenLabel = `${seasonOf(target.getMonth())} ${target.getFullYear()}`;
  const whenSub = `within the next ${monthsAhead} months`;

  return {
    partnerSign,
    partnerHints,
    element,
    elementBlurb: ELEMENT_BLURB[element],
    whenLabel,
    whenSub,
    setting: SETTINGS[seed % SETTINGS.length],
    scene: SCENES[(seed >> 3) % SCENES.length],
    advice: ADVICE[(seed >> 6) % ADVICE.length],
    score: primary.c.score,
    loveScore: primary.c.loveScore,
    keywords: primary.c.keywords?.slice(0, 4) ?? [],
  };
};

export const FindSoulmateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark, accent } = useTheme();
  const user = useStore((s) => s.user);

  const derivedSign = useMemo(
    () => normalizeSign(getZodiacInfo(user?.birthDate)?.sign) ?? normalizeSign(user?.zodiacSign),
    [user?.birthDate, user?.zodiacSign]
  );

  const [manualSign, setManualSign] = useState<ZodiacSignName | null>(null);
  const [phase, setPhase] = useState<'intro' | 'scanning' | 'result'>('intro');
  const [forecast, setForecast] = useState<Forecast | null>(null);

  const sign = derivedSign ?? manualSign;

  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const bg = isDark ? '#0B0820' : colors.background;
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : colors.surface;
  const border = colors.border;

  const reveal = async () => {
    if (!sign) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('scanning');
    fade.setValue(0);
    spin.setValue(0);
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true })
    ).start();

    setTimeout(() => {
      const f = buildForecast(sign, user?.id || user?.nickname || 'guest');
      setForecast(f);
      setPhase('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.timing(fade, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, 2300);
  };

  const reset = () => {
    setForecast(null);
    setPhase('intro');
  };

  const onShare = async () => {
    if (!forecast) return;
    try {
      await Share.share({
        message:
          `My Soulmate Meeting Forecast\n\n` +
          `When: ${forecast.whenLabel} (${forecast.whenSub})\n` +
          `Where: ${forecast.setting.title}\n` +
          `Their energy: ${forecast.element} — ${forecast.elementBlurb}\n` +
          `Match: ${forecast.score}%\n\n— Kosmos Astro`,
      });
    } catch {
      /* user dismissed */
    }
  };

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: cardBg, borderColor: border }]}>
            <ArrowCircleLeftIcon size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Meeting Forecast</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {phase !== 'result' ? (
            <View style={styles.introWrap}>
              <Animated.View style={[styles.orb, { transform: [{ rotate: phase === 'scanning' ? spinDeg : '0deg' }] }]}>
                <LinearGradient
                  colors={[accent.purple, accent.pink]}
                  style={styles.orbGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <ConstellationIcon size={64} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>

              {phase === 'scanning' ? (
                <>
                  <Text style={[styles.introTitle, { color: colors.text }]}>Aligning the stars…</Text>
                  <Text style={[styles.introSub, { color: colors.textSecondary }]}>
                    Reading your chart to find when your paths cross
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.introTitle, { color: colors.text }]}>
                    Discover when & where you'll meet them
                  </Text>
                  <Text style={[styles.introSub, { color: colors.textSecondary }]}>
                    A meeting forecast read from your own birth chart — not just a sign.
                  </Text>

                  {sign ? (
                    <View style={[styles.signPill, { backgroundColor: cardBg, borderColor: border }]}>
                      {React.createElement(SIGN_ICON[sign], { size: 18, color: accent.purple })}
                      <Text style={[styles.signPillText, { color: colors.text }]}>Based on your {sign} chart</Text>
                    </View>
                  ) : (
                    <View style={styles.selectorWrap}>
                      <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>
                        Add your birth date in your profile, or confirm your sign:
                      </Text>
                      <View style={styles.signGrid}>
                        {ALL_SIGNS.map((s) => {
                          const Icon = SIGN_ICON[s];
                          const active = manualSign === s;
                          return (
                            <TouchableOpacity
                              key={s}
                              onPress={() => { Haptics.selectionAsync(); setManualSign(s); }}
                              style={[
                                styles.signCell,
                                { backgroundColor: cardBg, borderColor: active ? accent.purple : border },
                              ]}
                            >
                              <Icon size={22} color={active ? accent.purple : colors.icon} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={reveal}
                    disabled={!sign}
                    activeOpacity={0.85}
                    style={[styles.cta, !sign && { opacity: 0.5 }]}
                  >
                    <LinearGradient
                      colors={[accent.purple, accent.pink]}
                      style={styles.ctaGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <SparklesIcon size={20} color="#FFFFFF" />
                      <Text style={styles.ctaText}>Reveal My Forecast</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : forecast ? (
            <Animated.View style={{ opacity: fade }}>
              {/* When */}
              <ForecastCard cardBg={cardBg} border={border} accent={accent.purple}
                Icon={HourglassIcon} label="WHEN" title={forecast.whenLabel}
                body={forecast.whenSub} colors={colors} />

              {/* Where */}
              <ForecastCard cardBg={cardBg} border={border} accent={accent.blue}
                Icon={CompassIcon} label="WHERE" title={forecast.setting.title}
                body={forecast.setting.detail} colors={colors} />

              {/* Their energy */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHead}>
                  <View style={[styles.cardIcon, { backgroundColor: `${accent.pink}22` }]}>
                    <MoonIcon size={20} color={accent.pink} />
                  </View>
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>THEIR ENERGY</Text>
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {forecast.element} element
                </Text>
                <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{forecast.elementBlurb}.</Text>
                <View style={styles.hintRow}>
                  {forecast.partnerHints.map((h) => {
                    const Icon = SIGN_ICON[h];
                    return (
                      <View key={h} style={[styles.hintChip, { borderColor: border }]}>
                        <Icon size={16} color={accent.purple} />
                        <Text style={[styles.hintText, { color: colors.text }]}>{h}</Text>
                      </View>
                    );
                  })}
                  <Text style={[styles.hintNote, { color: colors.textTertiary }]}>most likely signs</Text>
                </View>
              </View>

              {/* First meeting scene */}
              <ForecastCard cardBg={cardBg} border={border} accent={accent.gold}
                Icon={SparklesIcon} label="THE FIRST SIGN" title="" body={forecast.scene} colors={colors} />

              {/* Compatibility */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHead}>
                  <View style={[styles.cardIcon, { backgroundColor: `${accent.pink}22` }]}>
                    <HeartCircleIcon size={20} color={accent.pink} />
                  </View>
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>COMPATIBILITY</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreNum, { color: colors.text }]}>{forecast.score}%</Text>
                  <View style={styles.scoreBarWrap}>
                    <View style={[styles.scoreTrack, { backgroundColor: border }]}>
                      <View style={[styles.scoreFill, { width: `${forecast.score}%`, backgroundColor: accent.pink }]} />
                    </View>
                    <Text style={[styles.scoreSub, { color: colors.textTertiary }]}>
                      Romantic match {forecast.loveScore}%
                    </Text>
                  </View>
                </View>
                {forecast.keywords.length > 0 && (
                  <View style={styles.kwRow}>
                    {forecast.keywords.map((k) => (
                      <View key={k} style={[styles.kwChip, { backgroundColor: `${accent.purple}1A` }]}>
                        <Text style={[styles.kwText, { color: accent.purple }]}>{k}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Advice */}
              <View style={[styles.adviceCard, { borderColor: border }]}>
                <InfoIcon size={20} color={accent.purple} />
                <Text style={[styles.adviceText, { color: colors.textSecondary }]}>{forecast.advice}</Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity onPress={onShare} style={[styles.actionBtn, { borderColor: border }]}>
                  <ShareIcon size={18} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={reset} style={[styles.actionBtn, { borderColor: border }]}>
                  <RefreshIcon size={18} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Again</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const ForecastCard: React.FC<{
  Icon: React.FC<{ size?: number; color?: string }>;
  label: string;
  title: string;
  body: string;
  accent: string;
  cardBg: string;
  border: string;
  colors: any;
}> = ({ Icon, label, title, body, accent, cardBg, border, colors }) => (
  <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
    <View style={styles.cardHead}>
      <View style={[styles.cardIcon, { backgroundColor: `${accent}22` }]}>
        <Icon size={20} color={accent} />
      </View>
      <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
    {title ? <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text> : null}
    <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },

  introWrap: { alignItems: 'center', paddingTop: 32 },
  orb: { marginBottom: 28 },
  orbGradient: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontSize: FontSizes.xxl, fontWeight: '700', textAlign: 'center', marginBottom: 10, paddingHorizontal: 12 },
  introSub: { fontSize: FontSizes.md, textAlign: 'center', lineHeight: 21, paddingHorizontal: 18 },

  signPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, marginTop: 24 },
  signPillText: { fontSize: FontSizes.md, fontWeight: '600' },

  selectorWrap: { width: '100%', marginTop: 24 },
  selectorLabel: { fontSize: FontSizes.sm, textAlign: 'center', marginBottom: 14 },
  signGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  signCell: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },

  cta: { width: '100%', marginTop: 32, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaText: { color: '#FFFFFF', fontSize: FontSizes.lg, fontWeight: '700' },

  card: { borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, marginBottom: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1.2 },
  cardTitle: { fontSize: FontSizes.xl, fontWeight: '700', marginBottom: 6 },
  cardBody: { fontSize: FontSizes.md, lineHeight: 22 },

  hintRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  hintChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth },
  hintText: { fontSize: FontSizes.sm, fontWeight: '600' },
  hintNote: { fontSize: FontSizes.xs, fontStyle: 'italic' },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreNum: { fontSize: 40, fontWeight: '800' },
  scoreBarWrap: { flex: 1, gap: 8 },
  scoreTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 4 },
  scoreSub: { fontSize: FontSizes.xs },
  kwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  kwChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: BorderRadius.full },
  kwText: { fontSize: FontSizes.sm, fontWeight: '600' },

  adviceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, marginTop: 4, marginBottom: 20 },
  adviceText: { flex: 1, fontSize: FontSizes.md, lineHeight: 22 },

  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth },
  actionText: { fontSize: FontSizes.md, fontWeight: '600' },
});
