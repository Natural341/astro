// Home Screen
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBannerAd } from '../components/AppBannerAd';

import {
  CoinIcon,
  BellIcon,
  StarIcon,
  CompassIcon,
  ChevronRightIcon,
  SparklesIcon,
  BrushIcon,
  BirthChartIcon,
  FaceIcon,
  HeartCircleIcon,
  TarotIcon,
  PeopleIcon,
  PalmIcon,
  CoffeeIcon,
  NumerologyIcon,

  MoonIcon,
} from '../components/icons';
import { CoffeeSvgIcon, SoulmateSvgIcon, PalmSvgIcon, NumerologySvgIcon } from '../components/SvgAssetIcons';

import { MysticCard } from '../components/MysticCard';
import { getCardImage } from '../data/tarotImages';
import { StreakCard } from '../components/StreakCard';
import { OracleCard } from '../components/OracleCard';
import { MoonPhaseIcon } from '../components/MoonPhaseIcon';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { ASTROLOGERS } from '../data/astrologers';
import { getAstrologers, ApiAstrologer } from '../services/api';
import { useUnreadCount } from '../hooks/social';
import { Spacing, BorderRadius, FontSizes, Colors } from '../config/theme';
import { tracker } from '../services/eventTracker';

const LOCAL_AVATARS: Record<string, ImageSourcePropType> = {
  'Elara Moonstone':  require('../../assets/images/real_elara.jpg'),
  'Aamon Darkfire':   require('../../assets/images/real_aamon.jpg'),
  'Seraphina Vale':   require('../../assets/images/real_seraphina.jpg'),
  'Orion Stargazer':  require('../../assets/images/real_orion.jpg'),
  'Lyra Celestine':   require('../../assets/images/real_lyra.jpg'),
  'Zara Nightshade':  require('../../assets/images/real_lyra.jpg'),
  'Phoenix Drake':    require('../../assets/images/real_orion.jpg'),
};

function getAvatar(name: string, photo_url?: string): ImageSourcePropType {
  if (photo_url) return { uri: photo_url };
  return LOCAL_AVATARS[name] ?? require('../../assets/images/real_elara.jpg');
}

const ACCENT: Record<string, string> = {
  'Elara Moonstone': '#9D4EDD', 'Aamon Darkfire': '#E63946',
  'Seraphina Vale': '#2EC4B6',  'Orion Stargazer': '#F4A261',
  'Lyra Celestine': '#E9C46A',  'Zara Nightshade': '#7C3AED',
  'Phoenix Drake':  '#F97316',
};

const { width, height } = Dimensions.get('window');
const BG_HEIGHT = height * 1.6; // background image taller than screen for parallax room

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { colors, isDark, accent } = useTheme();
  const { user } = useStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tracker.track('screen_view', { screen: 'Home' });
  }, []);

  // Unread notification badge — shared cache, clears when notifications are read.
  const unreadCountQ = useUnreadCount();
  const unreadCount = unreadCountQ.data ?? 0;

  // Online astrologers from backend (fallback to local)
  const [onlineAstrologers, setOnlineAstrologers] = useState<ApiAstrologer[]>([]);

  const loadOnlineAstrologers = useCallback(() => {
    getAstrologers()
      .then(data => setOnlineAstrologers(data.filter(a => a.is_online)))
      .catch(() => {
        // Use local fallback — filter only online
        const local = ASTROLOGERS.filter(a => a.isOnline).map(a => ({
          id: a.id, name: a.name, title: a.title, bio: a.bio,
          photo_url: '', specialties: a.specializations,
          rating: a.rating, review_count: a.reviewCount,
          price: a.price, is_online: true, is_ai: true,
        }));
        setOnlineAstrologers(local);
      });
  }, []);

  useFocusEffect(loadOnlineAstrologers);

  // Refresh the unread badge whenever Home regains focus.
  useFocusEffect(
    useCallback(() => {
      unreadCountQ.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Calculate moon phase
  const getMoonPhase = () => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    return (dayOfYear % 29.5) / 29.5;
  };

  const moonPhase = getMoonPhase();
  const moonPhaseNames = [
    { name: t('moonPhaseNew'), value: 0, desc: t('moonPhaseNewDesc') },
    { name: t('moonPhaseWaxingCrescent'), value: 0.125, desc: t('moonPhaseWaxingCrescentDesc') },
    { name: t('moonPhaseFirstQuarter'), value: 0.25, desc: t('moonPhaseFirstQuarterDesc') },
    { name: t('moonPhaseWaxingGibbous'), value: 0.375, desc: t('moonPhaseWaxingGibbousDesc') },
    { name: t('moonPhaseFull'), value: 0.5, desc: t('moonPhaseFullDesc') },
    { name: t('moonPhaseWaningGibbous'), value: 0.625, desc: t('moonPhaseWaningGibbousDesc') },
    { name: t('moonPhaseLastQuarter'), value: 0.75, desc: t('moonPhaseLastQuarterDesc') },
    { name: t('moonPhaseWaningCrescent'), value: 0.875, desc: t('moonPhaseWaningCrescentDesc') },
  ];

  const currentMoonPhase = moonPhaseNames[Math.floor(moonPhase * 8) % 8];

  const features = [
    { title: 'Astro AI', subtitle: 'Kozmik Danışmanın', SvgIcon: SparklesIcon, image: require('../../assets/images/start.png'), color: '#9D4EDD', bgColors: ['#1A0533', '#3B0A6E', '#6B21A8', '#9D4EDD', '#7C3AED'], isNew: true, screen: 'AIChat' },
    { title: t('drawSoulmate'), subtitle: t('karmicPortrait'), SvgIcon: SoulmateSvgIcon, color: '#A855F7', bgColors: ['#2E0A4A', '#5B1A8C', '#8B3FC6', '#A855F7', '#C084FC'], isNew: true, screen: 'DrawSoulmate' },
    { title: t('birthChart'), subtitle: t('readYourFate'), SvgIcon: BirthChartIcon, color: '#8B5CF6', bgColors: ['#0F0E2A', '#1E1B5E', '#3730A3', '#6366F1', '#818CF8'], screen: 'BirthChart' },
    { title: t('faceReading'), subtitle: t('physiognomy'), SvgIcon: FaceIcon, color: '#C084FC', bgColors: ['#1C0938', '#4C1D95', '#7C3AED', '#A78BFA', '#C4B5FD'], isNew: true, screen: 'FaceReading' },
    { title: t('vedicChart'), subtitle: t('indianAstrology'), SvgIcon: StarIcon, color: '#7C3AED', bgColors: ['#0C0A2A', '#1E1670', '#3730A3', '#4F46E5', '#6366F1'], isNew: true, screen: 'VedicChart' },
    { title: t('synastryCompatibility'), subtitle: t('loveAnalysis'), SvgIcon: HeartCircleIcon, color: '#9333EA', bgColors: ['#2D0A1F', '#6B1543', '#9D174D', '#DB2777', '#F472B6'], screen: 'Synastry' },
    { title: t('tarotReading'), subtitle: t('selectCards'), image: require('../../assets/images/Tarot.png'), color: '#6D28D9', bgColors: ['#1A0333', '#2E0854', '#4C1D95', '#6D28D9', '#8B5CF6'], screen: 'Tarot', hasTarotCards: true },
    { title: t('findSoulmate'), subtitle: t('cosmicMatching'), SvgIcon: PeopleIcon, color: '#A855F7', bgColors: ['#350A3A', '#701A75', '#A21CAF', '#D946EF', '#E879F9'], isNew: true, screen: 'FindSoulmate' },
    { title: t('palmReading'), subtitle: t('readLines'), image: require('../../assets/svg/el_falı.png'), color: '#D4A574', bgColors: ['#1C0F02', '#451A03', '#78350F', '#B45309', '#D97706'], screen: 'PalmReading' },
    { title: t('coffeeReading'), subtitle: t('traditionalFortune'), SvgIcon: CoffeeSvgIcon, color: '#B08968', bgColors: ['#1A0E04', '#3B1A08', '#6B3410', '#92400E', '#B45309'], isNew: true, screen: 'CoffeeFortune' },
    { title: t('nameAnalysis'), subtitle: t('numerology'), SvgIcon: NumerologySvgIcon, color: '#9C7655', bgColors: ['#1A1002', '#422006', '#713F12', '#A16207', '#CA8A04'], screen: 'Numerology' },
  ];

  const premiumFeatures = [
    { title: t('risingSign'), subtitle: t('discoverYourMask'), image: require('../../assets/images/libra.png'), color: '#FF5E62', bgColors: ['#1F0505', '#7F1D1D', '#B91C1C', '#EF4444', '#F87171'], screen: 'RisingSign' },
    { title: t('dreamInterpretation'), subtitle: t('subconscious'), image: require('../../assets/images/dream_2988109.png'), color: '#FFA500', bgColors: ['#1A0E02', '#451A03', '#92400E', '#D97706', '#F59E0B'], screen: 'DreamInterpretation' },
    { title: t('planetHours'), subtitle: t('cosmicTiming'), image: require('../../assets/images/planets.png'), color: '#9C27B0', bgColors: ['#1A0530', '#3B0764', '#6B21A8', '#9333EA', '#A855F7'], screen: 'PlanetHours' },
  ];

  const bgTranslateY = scrollY.interpolate({
    inputRange: [0, 600],
    outputRange: [0, -180],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.bgWrapper}>
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: isDark ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.7)' }]}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {/* Profile photo — left */}
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <View style={styles.avatarContainer}>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarFallbackText}>
                      {(user?.nickname || 'G').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Greeting — next to avatar */}
            <View style={styles.greetingBlock}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {t('hello')},
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.nickname || t('guest')}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {/* Tokens */}
              <TouchableOpacity
                style={[styles.tokenButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => navigation.navigate('Premium')}
              >
                <View style={styles.tokenIcon}>
                  <CoinIcon size={24} />
                </View>
                <Text style={[styles.tokenText, { color: colors.text }]}>
                  {user?.tokens || 0}
                </Text>
              </TouchableOpacity>

              {/* Notifications */}
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => navigation.navigate('Notifications')}
              >
                <BellIcon size={22} color={colors.text} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Astrologers — Messages-style horizontal cards */}
          <View style={styles.advisorHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('advisors')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.advisorScroll}>
            {onlineAstrologers.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.advisorCard, { backgroundColor: isDark ? '#1E1E30' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#EBEBEB' }]}
                onPress={() => navigation.navigate('AstrologerChat', {
                  astrologer: {
                    name: a.name, title: a.title,
                    avatar: getAvatar(a.name, a.photo_url),
                    primaryColor: ACCENT[a.name] ?? '#9D4EDD',
                    systemPrompt: ASTROLOGERS.find(la => la.name === a.name)?.systemPrompt,
                  },
                })}
                activeOpacity={0.8}
              >
                <View style={styles.advisorAvatarWrap}>
                  <Image source={getAvatar(a.name, a.photo_url)} style={styles.advisorAvatar} />
                  {/* always online — we only show online ones here */}
                  <View style={[styles.advisorDot, { borderColor: isDark ? '#1E1E30' : '#F9F9F9' }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.advisorName, { color: colors.text }]} numberOfLines={1}>{a.name.split(' ')[0]}</Text>
                  <Text style={[styles.advisorRole, { color: isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF' }]} numberOfLines={1}>{a.title}</Text>
                  <View style={styles.advisorRating}>
                    <StarIcon size={10} color="#FFB300" strokeWidth={2} />
                    <Text style={[styles.advisorRatingText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF' }]}>{a.rating.toFixed(1)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Streak Card */}
        <StreakCard />

        {/* Oracle Card */}
        <OracleCard />

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <CompassIcon size={24} color={accent.purple} />
            <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
              {t('exploreAndCalculate')}
            </Text>
          </View>

          {features.map((feature, index) => (
            <MysticCard
              key={index}
              title={feature.title}
              subtitle={feature.subtitle}
              SvgIcon={feature.SvgIcon}
              imageIcon={feature.image}
              iconColor={feature.color}
              bgColors={feature.bgColors}

              isNew={feature.isNew}
              rightContent={feature.hasTarotCards ? (
                <View style={styles.tarotCardsRow}>
                  <Image source={getCardImage({ arcana: 'major', number: 17 })} style={[styles.tarotMiniCard, styles.tarotCardLeft]} resizeMode="cover" />
                  <Image source={getCardImage({ arcana: 'major', number: 18 })} style={[styles.tarotMiniCard, styles.tarotCardCenter]} resizeMode="cover" />
                  <Image source={getCardImage({ arcana: 'major', number: 19 })} style={[styles.tarotMiniCard, styles.tarotCardRight]} resizeMode="cover" />
                </View>
              ) : undefined}
              onPress={() => navigation.navigate(feature.screen)}
            />
          ))}
        </View>

        {/* Moon Phase Card */}
        <TouchableOpacity
          style={[styles.moonCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}
          onPress={() => navigation.navigate('Premium')}
        >
          <LinearGradient
            colors={['#1A1A2E', '#0F0F1A']}
            style={styles.moonCardGradient}
          >
            <View style={styles.moonIconContainer}>
              <MoonPhaseIcon phaseValue={currentMoonPhase.value} size={60} />
            </View>
            <View style={styles.moonContent}>
              <View style={styles.moonHeader}>
                <MoonIcon size={16} color={accent.purple} strokeWidth={2} />
                <Text style={styles.moonLabel}>{t('moonPhases')}</Text>
              </View>
              <Text style={styles.moonPhaseName}>{currentMoonPhase.name}</Text>
              <Text style={styles.moonPhaseDesc}>{currentMoonPhase.desc}</Text>
            </View>
            <Image
              source={require('../../assets/images/baslangic1.png')}
              style={styles.moonCardImage}
              resizeMode="contain"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Premium Section */}
        <View style={styles.premiumSection}>
          <View style={styles.premiumHeader}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>{t('pro')}</Text>
            </View>
            <Text style={styles.premiumTitle}>{t('premiumFeatures')}</Text>
          </View>

          {premiumFeatures.map((feature, index) => (
            <MysticCard
              key={index}
              title={feature.title}
              subtitle={feature.subtitle}
              imageIcon={feature.image}
              iconColor={feature.color}
              bgColors={feature.bgColors}

              isPremium={!user?.isPremium}
              onPress={() => {
                if (user?.isPremium) {
                  navigation.navigate(feature.screen);
                } else {
                  navigation.navigate('Premium');
                }
              }}
            />
          ))}
        </View>

        {!user?.isPremium && <AppBannerAd />}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  bgWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: BG_HEIGHT,
  },
  container: {
    flex: 1,
  },
  headerSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  greeting: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  tokenIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenText: {
    fontWeight: '700',
    fontSize: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4081',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#FF4081',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.accent.purple,
    overflow: 'hidden',
  },
  avatarFallback: {
    backgroundColor: Colors.accent.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  astrologersList: {
    paddingRight: Spacing.md,
  },

  // Advisor cards (Messages-style)
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9D4EDD',
  },
  advisorScroll: {
    gap: 10,
    paddingBottom: 4,
    paddingRight: 4,
  },
  advisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    width: 180,
  },
  advisorAvatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  advisorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  advisorDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
  },
  advisorName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  advisorRole: {
    fontSize: 10,
    marginBottom: 4,
  },
  advisorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  advisorRatingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionHeaderText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  moonCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  moonCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
  },
  moonIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moonCardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    opacity: 0.85,
  },
  moonContent: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  moonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moonLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  moonPhaseName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  moonPhaseDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 4,
  },
  premiumSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  premiumTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tarotCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 72,
    height: 52,
    justifyContent: 'center',
  },
  tarotMiniCard: {
    width: 32,
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    position: 'absolute',
  },
  tarotCardLeft: {
    transform: [{ rotate: '-10deg' }],
    left: 0,
    zIndex: 1,
  },
  tarotCardCenter: {
    zIndex: 3,
    left: 20,
  },
  tarotCardRight: {
    transform: [{ rotate: '10deg' }],
    left: 40,
    zIndex: 2,
  },
  bottomSpacer: {
    height: 160,
  },
});
