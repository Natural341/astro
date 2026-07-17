// Premium Screen — Professional & Modern
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  Image,
  Easing,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CoinIcon, XIcon, ChevronRightIcon, MoonIcon, ShieldTickIcon, StarIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing } from '../config/theme';
import { AppConfig } from '../config/appConfig';
import { getTokenPackages, ApiTokenPackage, validatePromoCode, PromoCodeResult, purchaseTokens as apiPurchaseTokens, claimAdReward, getMe } from '../services/api';
import { tracker } from '../services/eventTracker';
import { getOfferings, purchasePackage, purchaseConsumablePackage } from '../services/revenueCat';
import { showRewardedAd, getBannerAdUnitId } from '../services/adMob';
import type { PurchasesOffering } from 'react-native-purchases';

const { width } = Dimensions.get('window');

// ─── SVG check icon ───────────────────────────────────────────────────────────
const CheckSVG = ({ color = '#FFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M2.5 8L6.5 12L13.5 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Features ────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'infinite' as const, SvgIcon: null, color: '#A855F7', bg: 'rgba(168,85,247,0.12)', title: 'Unlimited AI Conversations', desc: 'Chat with no daily limits — full cosmic guidance 24/7.' },
  { icon: 'planet-outline' as const, SvgIcon: null, color: '#EC4899', bg: 'rgba(236,72,153,0.12)', title: 'Deep Birth Chart Analysis', desc: 'Full natal chart, progressions, transits and house interpretations.' },
  { icon: null as any, SvgIcon: MoonIcon, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', title: '50 Moon Tokens Daily', desc: 'Receive 50 tokens automatically each day, automatically.' },
  { icon: null as any, SvgIcon: ShieldTickIcon, color: '#10B981', bg: 'rgba(16,185,129,0.12)', title: 'Ad-Free Experience', desc: 'Zero interruptions. Pure cosmic focus.' },
  { icon: null as any, SvgIcon: StarIcon, color: '#9D4EDD', bg: 'rgba(157,78,221,0.12)', title: 'Early Access & Priority Support', desc: 'New features first and faster responses from our team.' },
];

// ─── Token packages — pricing psychology ─────────────────────────────────────
// Anchor: starter pack feels cheap, 4000 pack is the real "wow"
// Decoy effect: 500 pack makes 1500 look like clear winner
// Per-token savings shown as social proof
// Pricing psychology:
//  • Anchor: 100-pack at 0.10₺/token makes everything else look cheap
//  • Decoy:  350-pack (0.071₺) pushes users toward 750-pack (0.060₺) — clear jump
//  • Winner: 750-pack is priced to be the obvious "smart choice"
//  • Whale:  2000-pack for power users, 50% savings vs starter
interface TokenPack {
  id: string;
  tokens: number;
  price: string;
  priceNum: number;
  tag: string | null;
  tagColor: string;
  save: string | null;
  perToken: string;
  desc: string;
}

const TOKEN_PACKS: TokenPack[] = [
  {
    id: 'starter',
    tokens: 100,
    price: '49.99',
    priceNum: 49.99,
    tag: null,
    tagColor: '',
    save: null,
    perToken: '0.50₺/token',
    desc: 'Try it out',
  },
  {
    id: 'regular',
    tokens: 350,
    price: '149.99',
    priceNum: 149.99,
    tag: null,
    tagColor: '',
    save: '15%',
    perToken: '0.42₺/token',
    desc: 'Casual reader',
  },
  {
    id: 'popular',
    tokens: 750,
    price: '299.99',
    priceNum: 299.99,
    tag: 'MOST POPULAR',
    tagColor: '#9D4EDD',
    save: '20%',
    perToken: '0.39₺/token',
    desc: 'Best for active readers',
  },
  {
    id: 'value',
    tokens: 2000,
    price: '699.99',
    priceNum: 699.99,
    tag: 'BEST VALUE',
    tagColor: '#F59E0B',
    save: '30%',
    perToken: '0.34₺/token',
    desc: 'Power user pack',
  },
];

// What tokens buy — shown below token section (builds desire)
// 750-pack example: ~25 AI chats + 10 coffee readings + 5 birth charts ≈ 1 month for active user
const TOKEN_USES = [
  { action: 'Deep Birth Chart Analysis', cost: 20 },
  { action: 'Karmic Journey Analysis', cost: 20 },
  { action: 'Past Life Regression Reading', cost: 15 },
  { action: 'Synastry (Compatibility)', cost: 15 },
  { action: 'Dream Interpretation', cost: 10 },
  { action: 'Detailed Tarot Spread', cost: 10 },
  { action: 'AI Cosmic Chat', cost: 10 },
];

// Merge API package data with display metadata
const PACK_META: Record<string, { tag: string | null; tagColor: string; desc: string }> = {
  Starter: { tag: null,           tagColor: '',        desc: 'Try it out' },
  Regular: { tag: null,           tagColor: '',        desc: 'Casual reader' },
  Popular: { tag: 'MOST POPULAR', tagColor: '#9D4EDD', desc: 'Best for active readers' },
  Value:   { tag: 'BEST VALUE',   tagColor: '#F59E0B', desc: 'Power user pack' },
};

function buildDisplayPacks(apiPacks: ApiTokenPackage[]) {
  if (!apiPacks.length) return TOKEN_PACKS; // fallback
  return [...apiPacks]
    .sort((a, b) => a.display_order - b.display_order)
    .map(p => {
      const meta = PACK_META[p.name] ?? { tag: null, tagColor: '', desc: '' };
      const perToken = p.token_amount > 0
        ? `${(p.price_tl / p.token_amount).toFixed(2)}₺/token`
        : '';
      return {
        id: p.id,
        tokens: p.token_amount,
        price: p.price_tl.toFixed(2),
        priceNum: p.price_tl,
        save: p.bonus_percent > 0 ? `${p.bonus_percent}%` : null,
        perToken,
        ...meta,
      };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────
export const PremiumScreen: React.FC = () => {
  const navigation = useNavigation();
  const { updateUser, user } = useStore();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [tokenPacks, setTokenPacks] = useState(TOKEN_PACKS);

  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoCodeResult | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [tokenPurchaseLoading, setTokenPurchaseLoading] = useState(false);
  const [adRewardLoading, setAdRewardLoading] = useState(false);

  // Fetch live RevenueCat offering (subscription plans + token product packages)
  useEffect(() => {
    getOfferings().then(setOffering).catch(() => setOffering(null));
  }, []);

  // Track premium screen view
  useEffect(() => {
    tracker.track('premium_view', { screen: 'Premium' });
  }, []);

  // Fetch live packages from backend
  useEffect(() => {
    getTokenPackages()
      .then(data => {
        if (data.length > 0) {
          const packs = buildDisplayPacks(data);
          setTokenPacks(packs);
          // Auto-select popular or first
          const pop = packs.find(p => p.tag === 'MOST POPULAR') ?? packs[0];
          setSelectedToken(String(pop.id));
        }
      })
      .catch(() => {
        // keep local fallback, set default selection
        setSelectedToken('popular');
      });
  }, []);

  // Logo animations
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Slow spin
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSubscribe = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const rcPackage = selectedPlan === 'yearly' ? offering?.annual : offering?.monthly;
    if (!rcPackage) {
      Alert.alert(
        'Unavailable',
        'Subscription plans are not available right now. Please try again later.',
      );
      return;
    }

    setSubscribeLoading(true);
    try {
      const isPremium = await purchasePackage(rcPackage);
      if (isPremium) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        updateUser({ isPremium: true });
        Alert.alert(
          'Welcome to Premium',
          'Your subscription is now active. All features are unlocked.',
          [{ text: 'Continue', onPress: () => navigation.goBack() }],
        );
      }
      // purchasePackage() already surfaces cancellation/errors via handleSecureError;
      // no separate alert needed when isPremium is false (user cancelled or it failed silently).
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleTokenPurchase = async (pack: typeof tokenPacks[0]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedToken(pack.id);
  };

  const handleWatchAd = async () => {
    if (adRewardLoading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAdRewardLoading(true);
    try {
      const watched = await showRewardedAd();
      if (!watched) return; // cancelled, failed to load, or closed before earning the reward

      const result = await claimAdReward();
      if (user) updateUser({ tokens: result.new_total });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Reward earned', `+${result.tokens} Moon Tokens added to your account.`);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        e?.message?.includes('limit') ? 'Daily limit reached' : 'Something went wrong',
        e?.message?.includes('limit') ? "You've watched the max ads for today. Come back tomorrow!" : 'Please try again later.',
      );
    } finally {
      setAdRewardLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    try {
      const result = await validatePromoCode(promoCode.trim());
      setPromoResult(result);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setPromoError(e.message || 'Invalid promo code');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setPromoLoading(false);
  };

  const handleTokenConfirm = async () => {
    const pack = tokenPacks.find(p => String(p.id) === selectedToken);
    if (!pack) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let finalTokens = pack.tokens;
    let finalPrice = pack.priceNum;
    let promoLine = '';
    if (promoResult) {
      if (promoResult.discount_percent > 0) {
        finalPrice = finalPrice * (1 - promoResult.discount_percent / 100);
      }
      if (promoResult.discount_tokens > 0) {
        finalTokens += promoResult.discount_tokens;
      }
      promoLine = `\n${promoResult.code} applied`;
    }

    // RevenueCat package identifiers must match the backend token_packages.id
    // (configure this convention when setting up products in the RC dashboard).
    const rcPackage = offering?.availablePackages.find(
      p => p.identifier === pack.id || p.product.identifier === pack.id,
    );
    if (!rcPackage) {
      Alert.alert('Unavailable', 'This token package is not available for purchase right now.');
      return;
    }

    // Pre-flight check — don't charge the user for a package the backend no longer has.
    try {
      await apiPurchaseTokens(pack.id);
    } catch (e: any) {
      Alert.alert('Unavailable', e?.message || 'This token package is no longer available.');
      return;
    }

    Alert.alert(
      'Purchase Tokens',
      `Buy ${finalTokens.toLocaleString()} Moon Tokens for ${finalPrice.toFixed(2)}₺?${promoLine}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            setTokenPurchaseLoading(true);
            try {
              const info = await purchaseConsumablePackage(rcPackage);
              if (!info) return; // cancelled or failed — purchaseConsumablePackage already surfaced the error

              // The purchase is complete on RevenueCat's side, but tokens are
              // only credited once their webhook reaches our backend (usually
              // within a couple seconds) — see RevenueCatWebhook on the server.
              // Poll briefly for the balance to update rather than trusting
              // the client to know how many tokens were bought.
              const startingBalance = user?.tokens ?? 0;
              const expectedBalance = startingBalance + finalTokens;
              let newBalance = startingBalance;
              for (let attempt = 0; attempt < 8; attempt++) {
                await new Promise(r => setTimeout(r, 1500));
                const me = await getMe().catch(() => null);
                if (me && me.tokens >= expectedBalance) {
                  newBalance = me.tokens;
                  break;
                }
                if (me) newBalance = me.tokens;
              }

              if (user) updateUser({ tokens: newBalance });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (newBalance >= expectedBalance) {
                Alert.alert('Done', `${finalTokens.toLocaleString()} Moon Tokens added to your account.`);
              } else {
                Alert.alert(
                  'Purchase confirmed',
                  'Your payment went through — tokens may take a minute to appear. Pull to refresh if they don\'t show up shortly.',
                );
              }
            } catch (e: any) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Purchase failed', e?.message || 'Something went wrong. Please try again.');
            } finally {
              setTokenPurchaseLoading(false);
            }
          },
        },
      ]
    );
  };

  // Colors
  const bg = isDark ? colors.background : '#F6F4FB';
  const cardBg = isDark ? '#13131F' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#EAEAEE';
  const textColor = isDark ? '#FFFFFF' : '#12121A';
  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : '#8E8E9A';
  const sectionLabelColor = isDark ? 'rgba(255,255,255,0.35)' : '#ABABBA';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Background ambient */}
      {isDark && (
        <Animated.View style={[styles.ambientBg, { opacity: glowAnim }]} pointerEvents="none">
          <LinearGradient colors={['rgba(157,78,221,0.15)', 'transparent']} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Close */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EFEFEF' }]}
          >
            <XIcon size={20} color={textColor} />
          </TouchableOpacity>

          {/* ── Hero: animated start.png ── */}
          <View style={styles.hero}>
            <View style={styles.logoOuter}>
              {/* Spinning glow ring */}
              <Animated.View
                style={[styles.glowRing, { transform: [{ rotate: spinInterpolate }] }]}
                pointerEvents="none"
              />
              {/* Pulsing logo */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Image
                  source={require('../../assets/images/start.png')}
                  style={styles.logoImage}
                />
              </Animated.View>
            </View>
            <Text style={[styles.heroTitle, { color: textColor }]}>{t('kosmosPremium')}</Text>
            <Text style={[styles.heroSubtitle, { color: mutedColor }]}>
              Unlock the full depth of your cosmic journey.{'\n'}No limits. No interruptions.
            </Text>
          </View>

          {/* ── Features ── */}
          <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>{t('whatYouGet')}</Text>
          <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: Spacing.lg, marginBottom: 24 }]}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }]}>
                <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                  {f.SvgIcon ? <f.SvgIcon size={19} color={f.color} /> : <Ionicons name={f.icon} size={19} color={f.color} />}
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: textColor }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: mutedColor }]}>{f.desc}</Text>
                </View>
                <CheckSVG color="#9D4EDD" />
              </View>
            ))}
          </View>

          {/* ── Subscription plans ── */}
          <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>{t('subscription')}</Text>
          <View style={styles.plans}>
            {/* Yearly */}
            <TouchableOpacity
              style={[styles.planCard, { backgroundColor: cardBg, borderColor: selectedPlan === 'yearly' ? '#9D4EDD' : cardBorder }, selectedPlan === 'yearly' && styles.planSelected]}
              onPress={() => { Haptics.selectionAsync(); setSelectedPlan('yearly'); }}
              activeOpacity={0.85}
            >
              {selectedPlan === 'yearly' && (
                <LinearGradient colors={['rgba(157,78,221,0.09)', 'transparent']} style={StyleSheet.absoluteFill} />
              )}
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE · SAVE 33%</Text>
              </View>
              <View style={styles.planRow}>
                <View style={styles.planLeft}>
                  <View style={[styles.radio, { borderColor: selectedPlan === 'yearly' ? '#9D4EDD' : cardBorder }]}>
                    {selectedPlan === 'yearly' && <View style={styles.radioFill} />}
                  </View>
                  <View>
                    <Text style={[styles.planName, { color: textColor }]}>{t('annualPlan')}</Text>
                    <Text style={[styles.planNote, { color: '#10B981' }]}>{t('billedYearly')}</Text>
                  </View>
                </View>
                <View style={styles.planPriceBox}>
                  <Text style={[styles.planPrice, { color: textColor }]}>749.99<Text style={[styles.planUnit, { color: mutedColor }]}> ₺/yr</Text></Text>
                  <Text style={[styles.planMonthly, { color: mutedColor }]}>~62.49₺/mo</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Monthly */}
            <TouchableOpacity
              style={[styles.planCard, { backgroundColor: cardBg, borderColor: selectedPlan === 'monthly' ? '#9D4EDD' : cardBorder }, selectedPlan === 'monthly' && styles.planSelected]}
              onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
              activeOpacity={0.85}
            >
              {selectedPlan === 'monthly' && (
                <LinearGradient colors={['rgba(157,78,221,0.09)', 'transparent']} style={StyleSheet.absoluteFill} />
              )}
              <View style={styles.planRow}>
                <View style={styles.planLeft}>
                  <View style={[styles.radio, { borderColor: selectedPlan === 'monthly' ? '#9D4EDD' : cardBorder }]}>
                    {selectedPlan === 'monthly' && <View style={styles.radioFill} />}
                  </View>
                  <View>
                    <Text style={[styles.planName, { color: textColor }]}>{t('monthlyPlan')}</Text>
                    <Text style={[styles.planNote, { color: mutedColor }]}>{t('cancelAnytime')}</Text>
                  </View>
                </View>
                <View style={styles.planPriceBox}>
                  <Text style={[styles.planPrice, { color: textColor }]}>79.99<Text style={[styles.planUnit, { color: mutedColor }]}> ₺/mo</Text></Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Subscribe CTA ── */}
          <View style={[styles.ctaWrap, { paddingHorizontal: Spacing.lg }]}>
            <TouchableOpacity style={styles.ctaBtn} onPress={handleSubscribe} activeOpacity={0.88}>
              <LinearGradient colors={['#9D4EDD', '#6B21A8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
                <Text style={styles.ctaText}>
                  {selectedPlan === 'yearly' ? 'Start 7-Day Free Trial' : 'Subscribe Monthly'}
                </Text>
                <View style={styles.ctaArrow}>
                  <ChevronRightIcon size={17} color="#9D4EDD" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            {selectedPlan === 'yearly' && (
              <Text style={[styles.trialNote, { color: mutedColor }]}>
                Free for 7 days, then 749.99 ₺/year. Cancel before trial ends to avoid charges.
              </Text>
            )}
          </View>

          {/* ── Moon Token Packages ── */}
          <Text style={[styles.sectionLabel, { color: sectionLabelColor, marginTop: 28 }]}>{t('moonTokensUpper')}</Text>
          <Text style={[styles.tokenSubheading, { color: mutedColor, marginHorizontal: Spacing.lg, marginBottom: 14 }]}>
            Use tokens for readings, AI chat, and premium features. The more you buy, the less each reading costs.
          </Text>

          {/* What tokens buy */}
          <View style={[styles.tokenUsesCard, { backgroundColor: cardBg, borderColor: cardBorder, marginHorizontal: Spacing.lg, marginBottom: 16 }]}>
            <Text style={[styles.tokenUsesTitle, { color: textColor }]}>{t('tokenCostRef')}</Text>
            <View style={styles.tokenUsesList}>
              {TOKEN_USES.map((u, i) => (
                <View key={i} style={styles.tokenUsesRow}>
                  <Text style={[styles.tokenUsesAction, { color: mutedColor }]}>{u.action}</Text>
                  <View style={styles.tokenCostBadge}>
                    <CoinIcon size={16} />
                    <Text style={styles.tokenCostText}>{u.cost}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Token pack grid */}
          <View style={styles.tokenGrid}>
            {tokenPacks.map((pack) => {
              const isSelected = selectedToken === String(pack.id);
              return (
                <TouchableOpacity
                  key={pack.id}
                  style={[
                    styles.tokenCard,
                    { backgroundColor: cardBg, borderColor: isSelected ? '#9D4EDD' : cardBorder },
                    isSelected && styles.tokenCardSelected,
                  ]}
                  onPress={() => handleTokenPurchase(pack)}
                  activeOpacity={0.82}
                >
                  {isSelected && (
                    <LinearGradient colors={['rgba(157,78,221,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
                  )}
                  {pack.tag && (
                    <View style={[styles.tokenTag, { backgroundColor: pack.tagColor }]}>
                      <Text style={styles.tokenTagText}>{pack.tag}</Text>
                    </View>
                  )}
                  <View style={styles.tokenAmount}>
                    <CoinIcon size={22} />
                    <Text style={[styles.tokenAmountText, { color: textColor }]}>
                      {pack.tokens.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={[styles.tokenPrice, { color: textColor }]}>{pack.price}₺</Text>
                  {pack.save && (
                    <Text style={styles.tokenSave}>Save {pack.save}</Text>
                  )}
                  <Text style={[styles.tokenDesc, { color: mutedColor }]}>{pack.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Promo Code ── */}
          <View style={[styles.promoRow, { marginHorizontal: Spacing.lg, marginTop: 16 }]}>
            <TextInput
              style={[
                styles.promoInput,
                {
                  backgroundColor: cardBg,
                  borderColor: promoResult ? '#10B981' : promoError ? '#EF4444' : cardBorder,
                  color: textColor,
                },
              ]}
              placeholder={t('promoCodePh')}
              placeholderTextColor={mutedColor}
              value={promoCode}
              onChangeText={t => {
                setPromoCode(t.toUpperCase());
                setPromoResult(null);
                setPromoError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.promoBtn,
                { backgroundColor: promoResult ? '#10B981' : '#9D4EDD', opacity: promoLoading || !promoCode.trim() ? 0.6 : 1 },
              ]}
              onPress={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.promoBtnText}>
                {promoLoading ? '...' : promoResult ? 'Applied' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
          {promoResult && (
            <Text style={[styles.promoSuccess, { marginHorizontal: Spacing.lg }]}>
              {promoResult.title}
              {promoResult.discount_percent > 0 ? ` — ${promoResult.discount_percent}% off` : ''}
              {promoResult.discount_tokens > 0 ? ` +${promoResult.discount_tokens} bonus tokens` : ''}
            </Text>
          )}
          {!!promoError && (
            <Text style={[styles.promoErr, { marginHorizontal: Spacing.lg }]}>{promoError}</Text>
          )}

          {/* Token purchase CTA */}
          <View style={[styles.ctaWrap, { paddingHorizontal: Spacing.lg, marginTop: 16 }]}>
            <TouchableOpacity
              style={[styles.tokenCTA, { backgroundColor: '#9D4EDD', shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }]}
              onPress={handleTokenConfirm}
              activeOpacity={0.85}
            >
              <View style={styles.tokenCTALeft}>
                <CoinIcon size={26} />
                <Text style={[styles.tokenCTAText, { color: '#FFF' }]}>
                  {(() => {
                    const pack = tokenPacks.find(p => String(p.id) === selectedToken);
                    if (!pack) return 'Select a pack';
                    const bonus = promoResult?.discount_tokens ?? 0;
                    return `Buy ${(pack.tokens + bonus).toLocaleString()} Tokens`;
                  })()}
                </Text>
              </View>
              <Text style={[styles.tokenCTAPrice, { color: '#FFF' }]}>
                {(() => {
                  const pack = tokenPacks.find(p => String(p.id) === selectedToken);
                  if (!pack) return '';
                  const pct = promoResult?.discount_percent ?? 0;
                  const final = pct > 0 ? pack.priceNum * (1 - pct / 100) : pack.priceNum;
                  return `${final.toFixed(2)}₺`;
                })()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Watch ad for free tokens */}
          {!user?.isPremium && getBannerAdUnitId() && (
            <View style={[styles.ctaWrap, { paddingHorizontal: Spacing.lg, marginTop: 10 }]}>
              <TouchableOpacity
                style={[styles.tokenCTA, { backgroundColor: 'transparent', borderWidth: 1, borderColor: cardBorder }]}
                onPress={handleWatchAd}
                activeOpacity={0.85}
                disabled={adRewardLoading}
              >
                <View style={styles.tokenCTALeft}>
                  <CoinIcon size={22} />
                  <Text style={[styles.tokenCTAText, { color: textColor }]}>
                    {adRewardLoading ? 'Loading ad...' : t('watchAdForTokens')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Legal */}
          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL(AppConfig.termsOfServiceUrl)}>
              <Text style={[styles.legalLink, { color: mutedColor }]}>{t('termsShort')}</Text>
            </TouchableOpacity>
            <View style={[styles.legalDot, { backgroundColor: mutedColor }]} />
            <TouchableOpacity onPress={() => Linking.openURL(AppConfig.privacyPolicyUrl)}>
              <Text style={[styles.legalLink, { color: mutedColor }]}>{t('privacyShort')}</Text>
            </TouchableOpacity>
            <View style={[styles.legalDot, { backgroundColor: mutedColor }]} />
            <TouchableOpacity onPress={() => Linking.openURL('https://kosmosastro.app/aydinlatma-metni')}>
              <Text style={[styles.legalLink, { color: mutedColor }]}>Aydınlatma Metni</Text>
            </TouchableOpacity>
            <View style={[styles.legalDot, { backgroundColor: mutedColor }]} />
            <TouchableOpacity>
              <Text style={[styles.legalLink, { color: mutedColor }]}>{t('restore')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { paddingBottom: 20 },

  ambientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 340 },

  closeBtn: {
    marginLeft: Spacing.lg, marginTop: 12,
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Hero ──
  hero: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 24, paddingBottom: 28 },
  logoOuter: {
    width: 100, height: 100,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  glowRing: {
    position: 'absolute',
    width: 100, height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(157,78,221,0.4)',
    borderStyle: 'dashed',
  },
  logoImage: { width: 78, height: 78, borderRadius: 39 },
  heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 0.2, marginBottom: 10, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center' },

  // ── Section label ──
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginHorizontal: Spacing.lg, marginBottom: 12,
  },

  // ── Plans ──
  plans: { paddingHorizontal: Spacing.lg, gap: 10, marginBottom: 20 },
  planCard: { borderRadius: 18, borderWidth: 1.5, padding: 16, overflow: 'hidden' },
  planSelected: {
    shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  bestValueBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FFD700',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 12,
  },
  bestValueText: { fontSize: 9, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioFill: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#9D4EDD' },
  planName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  planNote: { fontSize: 11, fontWeight: '500' },
  planPriceBox: { alignItems: 'flex-end' },
  planPrice: { fontSize: 18, fontWeight: '800' },
  planUnit: { fontSize: 12, fontWeight: '400' },
  planMonthly: { fontSize: 10, marginTop: 2 },

  // ── CTA ──
  ctaWrap: { marginBottom: 20, marginTop: 10 },
  ctaBtn: {
    borderRadius: 28,
    shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12, marginBottom: 12,
  },
  ctaGradient: {
    height: 64, borderRadius: 28,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingLeft: 30, paddingRight: 10,
  },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  ctaArrow: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
  },
  trialNote: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // ── Features ──
  featureCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  featureIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  featureDesc: { fontSize: 11, lineHeight: 16 },

  // ── Token packages ──
  tokenSubheading: { fontSize: 12, lineHeight: 18 },
  tokenUsesCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  tokenUsesTitle: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  tokenUsesList: { gap: 8 },
  tokenUsesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tokenUsesAction: { fontSize: 12 },
  tokenCostBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  tokenCostText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },

  tokenGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg, gap: 10,
  },
  tokenCard: {
    width: (width - Spacing.lg * 2 - 10) / 2,
    borderRadius: 16, borderWidth: 1.5,
    padding: 14, overflow: 'hidden',
    minHeight: 120,
  },
  tokenCardSelected: {
    shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  tokenTag: {
    alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, marginBottom: 8,
  },
  tokenTagText: { fontSize: 8, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  tokenAmount: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  tokenAmountText: { fontSize: 20, fontWeight: '900' },
  tokenPrice: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  tokenSave: { fontSize: 10, fontWeight: '700', color: '#10B981', marginBottom: 2 },
  tokenPerUnit: { fontSize: 10, marginBottom: 2 },
  tokenDesc: { fontSize: 10 },

  tokenCTA: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderRadius: 20,
  },
  tokenCTALeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tokenCTAText: { fontSize: 16, fontWeight: '800' },
  tokenCTAPrice: { fontSize: 18, fontWeight: '900' },

  // ── Promo Code ──
  promoRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  promoInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  promoBtn: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  promoSuccess: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 6,
  },
  promoErr: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    marginTop: 6,
  },

  // ── Legal ──
  legalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 20, flexWrap: 'wrap',
  },
  legalLink: { fontSize: 11 },
  legalDot: { width: 3, height: 3, borderRadius: 1.5 },
});
