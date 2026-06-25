// Profile Screen — Modern & Clean
import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  CalendarIcon, ChevronRightIcon, UserIcon, EditIcon, CoinIcon,
  ShareIcon, BellIcon, GlobeIcon, LanguageIcon,
  LogoutIcon, ShieldTickIcon, DocumentTextIcon, TelescopeIcon,
  MoonIcon, SparklesIcon, TickCircleIcon,
} from '../components/icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing, Colors } from '../config/theme';
import { getStreak } from '../services/api';
import { useFriends } from '../hooks/social';
import { tracker } from '../services/eventTracker';
import { ensureNotificationPermission } from '../services/notifications';

const SIGN_KEY: Record<string, string> = {
  Aries: 'signAries', Taurus: 'signTaurus', Gemini: 'signGemini', Cancer: 'signCancer',
  Leo: 'signLeo', Virgo: 'signVirgo', Libra: 'signLibra', Scorpio: 'signScorpio',
  Sagittarius: 'signSagittarius', Capricorn: 'signCapricorn', Aquarius: 'signAquarius', Pisces: 'signPisces',
};
const EL_KEY: Record<string, string> = { Fire: 'elFire', Earth: 'elEarth', Air: 'elAir', Water: 'elWater' };
import { getZodiacInfo } from '../utils/zodiac';

const ACCENT = '#9D4EDD';

// ─── helpers ────────────────────────────────────────────────────
// Format from the Y-M-D parts directly — no `new Date(...)`/`toLocaleDateString`.
// Both are unreliable here: `new Date('YYYY-MM-DD')` parses as UTC, and Hermes
// (RN's engine) has limited Intl support, so toLocaleDateString can shift the day.
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const formatBirthDate = (birthDate?: string): string => {
  if (!birthDate) return '';
  const parts = birthDate.split('T')[0].split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return birthDate;
  const [y, m, d] = parts;
  if (m < 1 || m > 12) return birthDate;
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
};

// Normalize 'HH:MM:SS' / 'HH:MM' → 'HH:MM'
const formatBirthTime = (birthTime?: string): string => {
  if (!birthTime) return '';
  const [h, mn] = birthTime.split(':');
  return h && mn ? `${h}:${mn}` : '';
};

// ─── component ──────────────────────────────────────────────────
export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, streak, setStreak, logout } = useStore();

  const zodiacInfo = useMemo(() => getZodiacInfo(user?.birthDate), [user?.birthDate]);
  const isGuest = !user?.email;
  // Friend count via shared React Query cache — updates when friends change elsewhere.
  const friendCount = useFriends().data?.length ?? 0;
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('notificationsEnabled').then(v => setNotifEnabled(v !== 'false')).catch(() => {});
  }, []);

  const toggleNotifications = async () => {
    Haptics.selectionAsync();
    const next = !notifEnabled;
    setNotifEnabled(next);
    await AsyncStorage.setItem('notificationsEnabled', next ? 'true' : 'false');
    if (next) await ensureNotificationPermission();
  };

  useEffect(() => { tracker.track('screen_view', { screen: 'Profile' }); }, []);

  useEffect(() => {
    if (isGuest) return;
    getStreak()
      .then(data => setStreak({
        currentStreak: data.current_streak, longestStreak: data.longest_streak,
        lastClaimDate: data.last_claim_date, totalTokensEarned: data.total_tokens_earned,
      }))
      .catch(() => {});
  }, [user?.email]);

  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : '#F0F0F0';

  const handleLogout = () => {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await logout();
        // Send straight to the login screen — never back through splash/language/onboarding.
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      }},
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Discover Kosmos Astro — your cosmic guide! Use my code: ${user?.id?.substring(0, 8).toUpperCase() || 'KOSMOS'}`,
      });
    } catch { }
  };

  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  const iconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  // ── Menu Row helper ─────────────────────────────────────────
  const MenuRow = ({ icon: Icon, label, value, onPress, isLast }: {
    icon: any; label: string; value?: string; onPress: () => void; isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuRowLeft}>
        <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
          <Icon size={18} color={iconColor} />
        </View>
        <Text style={[styles.menuText, { color: textColor }]}>{label}</Text>
      </View>
      <View style={styles.menuRowRight}>
        {value && <Text style={[styles.menuValue, { color: secondaryText }]}>{value}</Text>}
        <ChevronRightIcon size={16} color={secondaryText} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'transparent' : colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── Hero: Avatar centered ─────────────────── */}
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              {user?.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{(user?.nickname || 'G').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.editBadge} onPress={() => navigation.navigate('EditProfile')}>
                <EditIcon size={12} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.heroName, { color: textColor }]}>{user?.nickname || 'Guest'}</Text>
            {isGuest ? (
              <Text style={[styles.heroSub, { color: secondaryText }]}>Guest Account</Text>
            ) : (
              <Text style={[styles.heroSub, { color: secondaryText }]}>{user?.email}</Text>
            )}

            {/* Zodiac + Element badges */}
            {zodiacInfo && (
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.08)' }]}>
                  <Text style={styles.badgeEmoji}>{zodiacInfo.symbol}</Text>
                  <Text style={[styles.badgeText, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }]}>{SIGN_KEY[zodiacInfo.sign] ? t(SIGN_KEY[zodiacInfo.sign] as any) : zodiacInfo.sign}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Text style={[styles.badgeText, { color: secondaryText }]}>{EL_KEY[zodiacInfo.element] ? t(EL_KEY[zodiacInfo.element] as any) : zodiacInfo.element}</Text>
                </View>
              </View>
            )}

            {/* Birth info */}
            {user?.birthDate && (
              <Text style={[styles.heroBirthInfo, { color: secondaryText }]}>
                {formatBirthDate(user.birthDate)}
                {formatBirthTime(user?.birthTime) ? ` · ${formatBirthTime(user.birthTime)}` : ''}
                {user?.birthCity ? ` · ${user.birthCity}` : ''}
              </Text>
            )}
          </View>

          {/* ── Guest Banner ──────────────────────────── */}
          {isGuest && (
            <TouchableOpacity
              style={[styles.guestBanner, { backgroundColor: cardBg, borderColor }]}
              onPress={() => navigation.navigate('Auth')}
              activeOpacity={0.8}
            >
              <UserIcon size={20} color={iconColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestTitle, { color: textColor }]}>Create an Account</Text>
                <Text style={[styles.guestSub, { color: secondaryText }]}>Save your readings & unlock features</Text>
              </View>
              <ChevronRightIcon size={18} color={secondaryText} />
            </TouchableOpacity>
          )}

          {/* ── Stats (Instagram style with card) ──────── */}
          <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.statsInner}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: textColor }]}>{user?.tokens || 0}</Text>
                <Text style={[styles.statLbl, { color: secondaryText }]}>{t('tokens')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: textColor }]}>{streak.currentStreak}</Text>
                <Text style={[styles.statLbl, { color: secondaryText }]}>{t('dayStreak')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.6}
                onPress={() => { Haptics.selectionAsync(); navigation.navigate('People'); }}
              >
                <Text style={[styles.statVal, { color: textColor }]}>{friendCount}</Text>
                <Text style={[styles.statLbl, { color: secondaryText }]}>{t('friends')}</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: textColor }]}>{streak.totalTokensEarned}</Text>
                <Text style={[styles.statLbl, { color: secondaryText }]}>{t('earned')}</Text>
              </View>
            </View>
          </View>

          {/* ── Premium Card ──────────────────────────── */}
          <TouchableOpacity
            style={[styles.premiumCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => !user?.isPremium && navigation.navigate('Premium')}
            activeOpacity={user?.isPremium ? 1 : 0.8}
          >
            <View style={[styles.premiumIconWrap, { backgroundColor: iconBg }]}>
              {user?.isPremium ? (
                <TickCircleIcon size={36} color={iconColor} />
              ) : (
                <SparklesIcon size={36} color={iconColor} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.premiumTitle, { color: textColor }]}>
                {user?.isPremium ? t('premiumActive') : t('unlockPremium')}
              </Text>
              <Text style={[styles.premiumSub, { color: secondaryText }]}>
                {user?.isPremium ? t('allFeaturesUnlocked') : t('premiumPerks')}
              </Text>
            </View>
            {!user?.isPremium && (
              <View style={[styles.upgradeBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                <Text style={[styles.upgradeText, { color: textColor }]}>{t('upgrade')}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── Become Astrologer ─────────────────────── */}
          {user?.role !== 'astrologer' && (
            <TouchableOpacity
              style={[styles.premiumCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => navigation.navigate('BecomeConsultant')}
              activeOpacity={0.8}
            >
              <View style={[styles.premiumIconWrap, { backgroundColor: iconBg }]}>
                <TelescopeIcon size={28} color={iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.premiumTitle, { color: textColor }]}>{t('becomeAstrologer')}</Text>
                <Text style={[styles.premiumSub, { color: secondaryText }]}>{t('becomeAstrologerSub')}</Text>
              </View>
              <ChevronRightIcon size={17} color={secondaryText} />
            </TouchableOpacity>
          )}

          {/* ── Referral ──────────────────────────────── */}
          <View style={[styles.referralCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.referralTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.referralTitle, { color: textColor }]}>{t('inviteFriends')}</Text>
                <Text style={[styles.referralSub, { color: secondaryText }]}>{t('referralReward')}</Text>
              </View>
              <Image source={require('../../assets/svg/giftbox_1139982.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
            </View>
            <TouchableOpacity style={[styles.referralBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} onPress={handleShare} activeOpacity={0.8}>
              <ShareIcon size={15} color={iconColor} />
              <Text style={[styles.referralBtnText, { color: textColor }]}>{t('shareInviteCode')}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Toggles ──────────────────────────────── */}
          <View style={[styles.menuCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity style={[styles.toggleRow, { borderBottomColor: borderColor }]} onPress={toggleTheme} activeOpacity={0.7}>
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
                  <MoonIcon size={18} color={iconColor} />
                </View>
                <Text style={[styles.menuText, { color: textColor }]}>{t('darkMode')}</Text>
              </View>
              <View style={[styles.switchTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]}>
                <View style={[styles.switchThumb, { left: isDark ? 20 : 2 }]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleRow, { borderBottomColor: 'transparent' }]} activeOpacity={0.7} onPress={toggleNotifications}>
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <BellIcon size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
                </View>
                <Text style={[styles.menuText, { color: textColor }]}>{t('notifications')}</Text>
              </View>
              <View style={[styles.switchTrack, { backgroundColor: notifEnabled ? ACCENT : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') }]}>
                <View style={[styles.switchThumb, { left: notifEnabled ? 20 : 2 }]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Settings ──────────────────────────────── */}
          <View style={[styles.menuCard, { backgroundColor: cardBg, borderColor }]}>
            <MenuRow icon={UserIcon} label={t('editProfile')} onPress={() => navigation.navigate('EditProfile')} />
            <MenuRow icon={LanguageIcon} label={t('language')} value={language === 'tr' ? 'Türkçe' : 'English'} onPress={() => navigation.navigate('LanguageSelection', { fromProfile: true })} isLast />
          </View>

          {/* ── Legal ─────────────────────────────────── */}
          <View style={[styles.menuCard, { backgroundColor: cardBg, borderColor }]}>
            <MenuRow icon={ShieldTickIcon} label={t('privacyPolicy')} onPress={() => navigation.navigate('Legal', { type: 'privacy' })} />
            <MenuRow icon={DocumentTextIcon} label={t('termsOfService')} onPress={() => navigation.navigate('Legal', { type: 'terms' })} isLast />
          </View>

          {/* ── Sign Out ──────────────────────────────── */}
          <View style={[styles.menuCard, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIcon, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)' }]}>
                  <LogoutIcon size={18} color="#EF4444" />
                </View>
                <Text style={styles.logoutText}>{t('signOut')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // ── Hero ──
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: {
    backgroundColor: 'rgba(157,78,221,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: '#9D4EDD' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#9D4EDD',
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#0F0C24',
  },
  heroName: { fontSize: 22, fontWeight: '800' },
  heroSub: { fontSize: 13 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  badgeEmoji: { fontSize: 14 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  heroBirthInfo: { fontSize: 12, marginTop: 4 },

  // ── Guest ──
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: Spacing.lg, marginBottom: 16,
    padding: 16, borderRadius: 18, borderWidth: 1,
  },
  guestTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  guestSub: { fontSize: 12 },

  // ── Stats card ──
  statsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 4,
  },
  statsInner: {
    flexDirection: 'row',
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLbl: { fontSize: 11 },

  // ── Premium ──
  premiumCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: Spacing.lg, marginBottom: 12,
    padding: 16, borderRadius: 20, borderWidth: 1,
  },
  premiumIconWrap: {
    width: 56, height: 56, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  premiumTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  premiumSub: { fontSize: 12, lineHeight: 16 },
  upgradeBadge: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 12,
  },
  upgradeText: { fontWeight: '700', fontSize: 13 },

  // ── Referral ──
  referralCard: {
    marginHorizontal: Spacing.lg, marginBottom: 16,
    borderRadius: 20, padding: 18, borderWidth: 1,
  },
  referralTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  referralTitle: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  referralSub: { fontSize: 12, lineHeight: 17 },
  referralBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 11, borderRadius: 12, gap: 7,
  },
  referralBtnText: { fontWeight: '700', fontSize: 14 },

  // ── Toggle ──
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  switchTrack: { width: 44, height: 24, borderRadius: 12, position: 'relative' },
  switchThumb: {
    position: 'absolute', top: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },

  // ── Menu ──
  menuCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: 20, borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuIcon: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuText: { fontSize: 15, fontWeight: '500' },
  menuValue: { fontSize: 13 },

  // ── Logout ──
  logoutRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
