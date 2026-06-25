import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowCircleLeftIcon,
  ClockIcon,
  CoinIcon,
  StarIcon,
  StarFilledIcon,
  GlobeIcon,
  ChatBubbleIcon,
  SparklesIcon,
  VerifyIcon,
  MagicStarIcon,
  PeopleIcon,
  ShieldTickIcon,
  AddCircleIcon,
} from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { ASTROLOGERS } from '../data/astrologers';

const { width: SCREEN_W } = Dimensions.get('window');
const ACCENT = '#9D4EDD';

export const AstrologerProfileScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { friends, addFriend, removeFriend } = useStore();

  const astrologer = route.params?.astrologer ?? {
    name: 'Elara Moonstone', title: 'Vedic Astrologer',
    avatar: require('../../assets/images/real_elara.jpg'), primaryColor: '#9D4EDD',
  };

  const canonical = ASTROLOGERS.find(a => a.name === astrologer.name);
  const extra = canonical ?? {
    id: '1', bio: 'A dedicated astrologer with years of experience.',
    specializations: ['Astrology', 'Guidance'], rating: 4.8,
    reviewCount: 500, price: 40, responseTime: '< 15 min',
    languages: ['English'], isOnline: true,
  };

  const [userRating, setUserRating] = useState<number>(0);
  const [displayRating, setDisplayRating] = useState(extra.rating);
  const [displayReviewCount, setDisplayReviewCount] = useState(extra.reviewCount);
  const isFriend = canonical ? friends.includes(canonical.id) : false;

  const handleRate = (star: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (star === userRating) {
      // Tap same star again → remove rating
      setUserRating(0);
      setDisplayRating(extra.rating);
      setDisplayReviewCount(extra.reviewCount);
      return;
    }
    setUserRating(star);
    const newCount = extra.reviewCount + 1;
    const newRating = ((extra.rating * extra.reviewCount) + star) / newCount;
    setDisplayRating(Math.round(newRating * 10) / 10);
    setDisplayReviewCount(newCount);
  };

  const toggleFriend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (canonical) {
      if (isFriend) removeFriend(canonical.id);
      else addFriend(canonical.id);
    }
  };

  const startChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('AstrologerChat', { astrologer });
  };

  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const cardBg = isDark ? 'rgba(30,30,56,0.6)' : 'rgba(248,246,255,0.8)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>

        {/* ── Hero ────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: isDark ? 'rgba(26,26,46,0.8)' : 'rgba(248,244,255,0.9)' }]}>
          <SafeAreaView edges={['top']}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
                <ArrowCircleLeftIcon size={22} color={textColor} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={toggleFriend} style={styles.topBtn}>
                <PeopleIcon size={20} color={isFriend ? ACCENT : secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Avatar + info */}
            <View style={styles.heroContent}>
              <View style={styles.avatarContainer}>
                <Image source={astrologer.avatar} style={[styles.avatar, { borderColor: ACCENT + '40' }]} />
                {(extra as any).isOnline && (
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                  </View>
                )}
              </View>

              <View style={styles.heroInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.heroName, { color: textColor }]}>{astrologer.name}</Text>
                  <VerifyIcon size={18} color="#3B82F6" />
                </View>
                <Text style={[styles.heroTitle, { color: secondaryText }]}>{astrologer.title}</Text>

                {/* Rating inline */}
                <View style={styles.ratingRow}>
                  <StarFilledIcon size={14} color="#FFD700" />
                  <Text style={styles.ratingNum}>{displayRating}</Text>
                  <Text style={[styles.reviewCount, { color: secondaryText }]}>({displayReviewCount.toLocaleString()})</Text>
                </View>
              </View>
            </View>

            {/* Quick stats */}
            <View style={[styles.statsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor }]}>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: textColor }]}>{extra.reviewCount.toLocaleString()}</Text>
                <Text style={[styles.statLbl, { color: secondaryText }]}>{t('sessions')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: textColor }]}>{extra.price}</Text>
                <Text style={[styles.statLbl, { color: secondaryText }]}>{t('tokens')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: textColor }]}>{extra.responseTime}</Text>
                <Text style={[styles.statLbl, { color: secondaryText }]}>{t('response')}</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.body}>

          {/* ── Rate this astrologer ─────────────────── */}
          <View style={[styles.rateCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.rateHeader}>
              <MagicStarIcon size={16} color={ACCENT} />
              <Text style={[styles.rateTitle, { color: textColor }]}>Rate {astrologer.name.split(' ')[0]}</Text>
            </View>
            <View style={styles.starsInteractive}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => handleRate(star)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                  <StarFilledIcon
                    size={34}
                    color={star <= userRating ? '#FFD700' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {userRating > 0 && (
              <Text style={[styles.rateThank, { color: secondaryText }]}>
                You rated {userRating}/5 · Tap again to remove
              </Text>
            )}
          </View>

          {/* ── About ────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: secondaryText }]}>{t('about')}</Text>
            <Text style={[styles.bioText, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)' }]}>
              {extra.bio}
            </Text>
          </View>

          {/* ── Specializations ──────────────────────── */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: secondaryText }]}>{t('specializations')}</Text>
            <View style={styles.chipRow}>
              {extra.specializations.map(sp => (
                <View key={sp} style={[styles.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <SparklesIcon size={12} color={ACCENT} />
                  <Text style={[styles.chipText, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>{sp}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Details ──────────────────────────────── */}
          <View style={[styles.detailCard, { backgroundColor: cardBg, borderColor }]}>
            {[
              { Icon: ClockIcon, label: 'Response time', value: extra.responseTime },
              { Icon: CoinIcon, label: 'Price per message', value: `${extra.price} Moon Tokens` },
              { Icon: StarIcon, label: 'Rating', value: `${displayRating} / 5` },
              { Icon: GlobeIcon, label: 'Languages', value: extra.languages.join(', ') },
              { Icon: ShieldTickIcon, label: 'Verified', value: 'Certified Astrologer' },
            ].map((row, i) => (
              <View key={i}>
                {i > 0 && <View style={[styles.rowDivider, { backgroundColor: borderColor }]} />}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: isDark ? 'rgba(157,78,221,0.1)' : 'rgba(157,78,221,0.06)' }]}>
                    <row.Icon size={16} color={ACCENT} />
                  </View>
                  <Text style={[styles.detailLabel, { color: secondaryText }]}>{row.label}</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── CTA Bar ──────────────────────────────────── */}
      <View style={[styles.ctaBar, { backgroundColor: colors.background, paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
        <TouchableOpacity onPress={startChat} style={styles.ctaBtn} activeOpacity={0.88}>
          <ChatBubbleIcon size={20} color="#FFF" />
          <Text style={styles.ctaBtnText}>Start Chat · {extra.price} tokens</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Hero ──
  hero: {
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  topBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 18,
    marginBottom: 20,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3,
  },
  onlineBadge: {
    position: 'absolute', right: 2, bottom: 2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#4ADE80',
    borderWidth: 3, borderColor: 'rgba(26,26,46,0.8)',
  },
  onlineDot: {},
  heroInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroName: { fontSize: 22, fontWeight: '800' },
  heroTitle: { fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingNum: { fontSize: 14, fontWeight: '700', color: '#FFD700' },
  reviewCount: { fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLbl: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1 },

  // ── Body ──
  body: { padding: 16, gap: 14 },

  // ── Rate Card ──
  rateCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  rateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateTitle: { fontSize: 16, fontWeight: '700' },
  starsInteractive: { flexDirection: 'row', gap: 12 },
  rateThank: { fontSize: 13, fontWeight: '600' },

  // ── Section Card ──
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  bioText: { fontSize: 15, lineHeight: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  // ── Detail Card ──
  detailCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16,
  },
  rowDivider: { height: 1, marginHorizontal: 16 },
  detailIcon: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  detailLabel: { flex: 1, fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },

  // ── CTA ──
  ctaBar: { paddingHorizontal: 16, paddingTop: 12 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 18,
    backgroundColor: ACCENT,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
