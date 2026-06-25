import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowCircleLeftIcon,
  BellIcon,
  BellSlashIcon,
  InfoIcon,
  ClockIcon,
  SparklesIcon,
  TelescopeIcon,
  PlanetIcon,
} from '../components/icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../services/notifications';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { Spacing } from '../config/theme';

// ─── Planet images ──────────────────────────────────────────────
const PLANET_IMAGES: Record<string, ImageSourcePropType> = {
  Saturn: require('../../assets/planet/Satürn_hd.jpg'),
  Jupiter: require('../../assets/planet/jupite.jpg'),
  Mars: require('../../assets/planet/mars.jpg'),
  Sun: require('../../assets/planet/gunes_.jpg'),
  Venus: require('../../assets/planet/venüs.jpg'),
  Mercury: require('../../assets/planet/merkür.jpg'),
  Moon: require('../../assets/planet/FullMoon2010.jpg'),
  Neptune: require('../../assets/planet/neptün.jpg'),
  Uranus: require('../../assets/planet/uranüs.jpg'),
};

const ACCENT = '#9D4EDD';
const { width: SCREEN_W } = Dimensions.get('window');

// ─── NASA APOD type ─────────────────────────────────────────────
interface NasaApod {
  title: string;
  url: string;
  hdurl?: string;
  explanation: string;
  media_type: string;
  date: string;
  copyright?: string;
}

// ─── Outer planets (not part of Chaldean cycle) ─────────────────
const OUTER_PLANETS = [
  {
    name: 'Neptune',
    desc: 'The mystic giant. Neptune governs dreams, illusions, spirituality, and the deepest layers of the subconscious mind.',
    traits: ['Dreams', 'Spirituality', 'Illusion', 'Intuition'],
  },
  {
    name: 'Uranus',
    desc: 'The awakener. Uranus rules sudden change, innovation, rebellion, and the spark of genius that shatters convention.',
    traits: ['Innovation', 'Freedom', 'Revolution', 'Genius'],
  },
];

// ─── Chaldean order ─────────────────────────────────────────────
const PLANETS = [
  {
    name: 'Saturn',
    symbol: '♄',
    color: '#90A4AE',
    activities: ['Discipline', 'Structure', 'Patience'],
    desc: 'Focus on long-term plans and responsibilities. A powerful time for setting boundaries and building lasting foundations.',
    elementTips: {
      Fire:  'Channel Saturn\'s energy into strategic planning — your drive will benefit from structure today.',
      Earth: 'This is your power hour. Saturn aligns with your grounded nature for maximum productivity.',
      Air:   'Slow down your racing thoughts — use Saturn\'s hour to organize and prioritize your ideas.',
      Water: 'Honor your need for emotional security. Saturn helps you build the stability you crave.',
    },
  },
  {
    name: 'Jupiter',
    symbol: '♃',
    color: '#CE93D8',
    activities: ['Education', 'Law', 'Luck'],
    desc: 'Great time for learning, legal matters, and expansion. Fortune smiles on bold aspirations under Jupiter.',
    elementTips: {
      Fire:  'Your natural boldness is amplified. Take that leap — Jupiter favors the daring.',
      Earth: 'Invest in yourself through learning or a new skill. Jupiter rewards patient growth.',
      Air:   'A perfect hour for networking and meaningful conversations. Your words carry extra influence.',
      Water: 'Trust your intuition about opportunities. Jupiter is opening doors aligned with your soul.',
    },
  },
  {
    name: 'Mars',
    symbol: '♂',
    color: '#EF9A9A',
    activities: ['Sports', 'Action', 'Courage'],
    desc: 'Channel energy into physical activity and bold moves. Mars rewards decisive action and fearless initiative.',
    elementTips: {
      Fire:  'This is your hour. Pure fire energy — lead, act, and conquer without hesitation.',
      Earth: 'Apply Mars\'s drive to your most demanding tasks. Steady momentum beats impulsive leaps.',
      Air:   'Speak up and advocate for yourself. Mars gives your words power and conviction.',
      Water: 'Push through emotional inertia. Use Mars to take one courageous step you\'ve been delaying.',
    },
  },
  {
    name: 'Sun',
    symbol: '☉',
    color: '#FFD54F',
    activities: ['Leadership', 'Creativity', 'Success'],
    desc: 'Shine in leadership roles and creative projects. The Sun illuminates your purpose and magnifies your presence.',
    elementTips: {
      Fire:  'Your charisma is off the charts right now. Step into the spotlight — you were born for this hour.',
      Earth: 'Let your quiet confidence shine. The Sun validates your steady, reliable nature today.',
      Air:   'Radiate your ideas — the Sun amplifies your communication. Share your vision widely.',
      Water: 'Your inner light shines through. Nurture creative expression and let your soul speak.',
    },
  },
  {
    name: 'Venus',
    symbol: '♀',
    color: '#F48FB1',
    activities: ['Love', 'Art', 'Beauty'],
    desc: 'Perfect for romance, art, and social connections. Venus opens your heart and enhances your magnetic allure.',
    elementTips: {
      Fire:  'Your passion makes you irresistible. Pursue that romantic spark with confidence.',
      Earth: 'Surround yourself with beauty — art, nature, or good food. Venus aligns with your sensuality.',
      Air:   'Charm is your superpower this hour. Connect, flirt, and let relationships deepen naturally.',
      Water: 'Deep emotional bonds are your gift now. Reach out to someone you love and be vulnerable.',
    },
  },
  {
    name: 'Mercury',
    symbol: '☿',
    color: '#FFF59D',
    activities: ['Communication', 'Trade', 'Learning'],
    desc: 'Ideal for negotiations, writing, and quick thinking. Mercury sharpens your mind and speeds up information flow.',
    elementTips: {
      Fire:  'Pitch your ideas with passion — Mercury turbocharges your natural enthusiasm.',
      Earth: 'Tackle paperwork, contracts, or detailed analysis. Your precision and Mercury form a perfect team.',
      Air:   'This is your superpower hour. Write, talk, think, create — your mind is operating at peak.',
      Water: 'Journal or talk through your feelings. Mercury helps you translate emotion into clarity.',
    },
  },
  {
    name: 'Moon',
    symbol: '☽',
    color: '#90CAF9',
    activities: ['Intuition', 'Emotions', 'Family'],
    desc: 'Listen to your intuition and nurture relationships. The Moon reflects your deepest needs and ancestral wisdom.',
    elementTips: {
      Fire:  'Rest your inner warrior. The Moon asks you to feel before you act — honor that.',
      Earth: 'Connect with home, family, or self-care rituals. The Moon activates your nurturing side.',
      Air:   'Let your gut speak louder than your logic this hour. Intuition holds answers your mind can\'t reach.',
      Water: 'This is your peak hour — Moon energy flows naturally through your water soul. Trust everything you feel.',
    },
  },
];

const DAY_RULER_INDEX = [3, 6, 2, 5, 1, 4, 0];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ZODIAC_ELEMENTS: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

const ELEMENT_COLORS = {
  Fire: '#FF5733', Earth: '#6B8E23', Air: '#64B5F6', Water: '#42A5F5',
};

const getZodiacFromBirth = (birthDate?: string): string | null => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
};

// ─── Notification helpers ───────────────────────────────────────
const requestPermissions = ensureNotificationPermission;

const scheduleHourlyNotifications = async (
  dayRulerIdx: number,
  currentHour: number,
  zodiac: string | null,
  element: string | null,
) => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  const promises = [];
  for (let h = currentHour + 1; h < 24; h++) {
    const planet = PLANETS[(dayRulerIdx + h) % 7];
    const personalTip = (element && (planet.elementTips as any)[element])
      ? ` · ${(planet.elementTips as any)[element]}`
      : '';
    const triggerDate = new Date(now);
    triggerDate.setHours(h, 0, 0, 0);
    promises.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: `${planet.symbol} ${planet.name} Hour`,
          body: planet.activities.join(' · ') + (zodiac ? ` — ${zodiac} tip${personalTip}` : ''),
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      })
    );
  }
  await Promise.all(promises);
};

// ─── Planet Avatar ──────────────────────────────────────────────
const PlanetAvatar = ({
  name,
  symbol,
  size,
  isDark,
}: {
  name: string;
  symbol: string;
  size: number;
  isDark: boolean;
}) => {
  const img = PLANET_IMAGES[name];
  if (img) {
    return (
      <Image
        source={img}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        resizeMode="cover"
      />
    );
  }
  // Fallback: symbol in a circle
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: size * 0.45, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>
        {symbol}
      </Text>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════
export const PlanetHoursScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [apod, setApod] = useState<NasaApod | null>(null);
  const [apodLoading, setApodLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // NASA APOD fetch
  useEffect(() => {
    const fetchApod = async () => {
      try {
        const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        if (res.ok) {
          const data: NasaApod = await res.json();
          // Only show if image AND no third-party copyright (NASA images are public domain)
          if (data.media_type === 'image' && !data.copyright) setApod(data);
        }
      } catch { /* silent */ }
      setApodLoading(false);
    };
    fetchApod();
  }, []);

  const dayOfWeek = currentTime.getDay();
  const dayRulerIdx = DAY_RULER_INDEX[dayOfWeek];
  const dayRuler = PLANETS[dayRulerIdx];
  const currentHour = currentTime.getHours();

  const zodiac = useMemo(() => user?.zodiacSign || getZodiacFromBirth(user?.birthDate), [user?.zodiacSign, user?.birthDate]);
  const element = zodiac ? (ZODIAC_ELEMENTS[zodiac] ?? null) : null;
  const elementColor = element ? ELEMENT_COLORS[element] : null;

  const getPlanetForHour = useCallback((hour: number) => PLANETS[(dayRulerIdx + hour) % 7], [dayRulerIdx]);
  const currentPlanet = useMemo(() => getPlanetForHour(currentHour), [currentHour, getPlanetForHour]);
  const personalTip = element ? (currentPlanet.elementTips as any)[element] as string : null;

  const allHours = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      planet: getPlanetForHour(i),
      isCurrent: i === currentHour,
    })),
    [dayRulerIdx, currentHour, getPlanetForHour]
  );

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
      return;
    }
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Permission Required', 'Please enable notifications in your device settings to receive planet hour alerts.');
      return;
    }
    try {
      await scheduleHourlyNotifications(dayRulerIdx, currentHour, zodiac, element);
      setNotificationsEnabled(true);
      Alert.alert(
        'Notifications Enabled',
        `You'll receive a cosmic nudge at the start of each planetary hour for the rest of today.${zodiac ? ` Personalized for ${zodiac}.` : ''}`,
      );
    } catch {
      Alert.alert('Error', 'Could not schedule notifications. Please try again.');
    }
  };

  const bgColor = colors.background;
  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(30,30,56,0.7)' : 'rgba(248,246,255,0.85)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)';

  const formatHour = (h: number) => {
    const suffix = h < 12 ? 'AM' : 'PM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}:00 ${suffix}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header — minimal */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            >
              <ArrowCircleLeftIcon size={22} color={textColor} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.notifBtn, {
                backgroundColor: notificationsEnabled ? ACCENT : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              }]}
              onPress={handleNotificationToggle}
            >
              {notificationsEnabled
                ? <BellIcon size={20} color="#FFF" />
                : <BellSlashIcon size={20} color={secondaryText} />
              }
            </TouchableOpacity>
          </View>

          {/* ── Current Planet Hero (big visual) ────────── */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
            {/* Big planet image */}
            <View style={styles.heroImageWrap}>
              <PlanetAvatar name={currentPlanet.name} symbol={currentPlanet.symbol} size={120} isDark={isDark} />
              <View style={[styles.heroGlow, { borderColor: ACCENT + '25' }]} />
            </View>

            <Text style={[styles.heroPlanetName, { color: textColor }]}>{currentPlanet.name}</Text>
            <Text style={[styles.heroTime, { color: ACCENT }]}>
              {formatHour(currentHour)} — {formatHour(currentHour + 1)} · {DAY_NAMES[dayOfWeek]}
            </Text>

            <Text style={[styles.heroPlanetDesc, { color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.55)' }]}>
              {currentPlanet.desc}
            </Text>

            {/* Activities */}
            <View style={styles.heroChips}>
              {currentPlanet.activities.map((a, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor }]}>
                  <Text style={[styles.chipText, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)' }]}>{a}</Text>
                </View>
              ))}
            </View>

            {/* Personal tip inline — if zodiac known */}
            {zodiac && element && personalTip && (
              <View style={[styles.heroPersonal, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <View style={styles.heroPersonalHeader}>
                  <SparklesIcon size={14} color={ACCENT} />
                  <Text style={[styles.heroPersonalBadge, { color: ACCENT }]}>{zodiac} · {element}</Text>
                </View>
                <Text style={[styles.heroPersonalTip, { color: isDark ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.5)' }]}>
                  {personalTip}
                </Text>
              </View>
            )}
          </View>

          {/* ── NASA Astronomy Picture of the Day ─────── */}
          {apod && (
            <View style={[styles.apodCard, { backgroundColor: cardBg, borderColor }]}>
              <Image
                source={{ uri: apod.url }}
                style={styles.apodImage}
                resizeMode="cover"
              />
              <View style={styles.apodContent}>
                <View style={styles.apodBadgeRow}>
                  <TelescopeIcon size={14} color={ACCENT} />
                  <Text style={[styles.apodBadge, { color: ACCENT }]}>NASA · {apod.date}</Text>
                </View>
                <Text style={[styles.apodTitle, { color: textColor }]} numberOfLines={2}>{apod.title}</Text>
                <Text style={[styles.apodDesc, { color: secondaryText }]} numberOfLines={3}>
                  {apod.explanation}
                </Text>
              </View>
            </View>
          )}

          {/* ── 24 Hour Cards ────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ClockIcon size={16} color={secondaryText} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>All 24 Hours</Text>
          </View>

          <View style={styles.hourCardsGrid}>
            {allHours.map((h) => {
              const isNow = h.isCurrent;
              return (
                <View
                  key={h.hour}
                  style={[
                    styles.hourCard,
                    {
                      backgroundColor: isNow
                        ? (isDark ? 'rgba(42,30,68,0.8)' : 'rgba(240,234,255,0.9)')
                        : cardBg,
                      borderColor: isNow
                        ? (isDark ? 'rgba(157,78,221,0.3)' : 'rgba(157,78,221,0.2)')
                        : borderColor,
                    },
                  ]}
                >
                  {/* Planet image */}
                  <PlanetAvatar name={h.planet.name} symbol={h.planet.symbol} size={64} isDark={isDark} />

                  {/* Info */}
                  <View style={styles.hourCardInfo}>
                    <View style={styles.hourCardTopRow}>
                      <Text style={[styles.hourCardPlanet, { color: isNow ? (isDark ? '#FFF' : '#1A1A2E') : textColor }]}>
                        {h.planet.name}
                      </Text>
                      {isNow && (
                        <View style={[styles.nowBadge, { backgroundColor: ACCENT }]}>
                          <Text style={styles.nowBadgeText}>NOW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.hourCardTime, { color: isNow ? ACCENT : secondaryText }]}>
                      {formatHour(h.hour)} — {formatHour(h.hour + 1)}
                    </Text>
                    {/* Activities as chips */}
                    <View style={styles.hourCardChips}>
                      {h.planet.activities.map((a, i) => (
                        <View key={i} style={[styles.hourCardChip, {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                        }]}>
                          <Text style={[styles.hourCardChipText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)' }]}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Outer Planets ───────────────────────────── */}
          <View style={styles.sectionHeader}>
            <PlanetIcon size={16} color={secondaryText} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('outerPlanets')}</Text>
          </View>

          <View style={styles.outerGrid}>
            {OUTER_PLANETS.map((p) => (
              <View key={p.name} style={[styles.outerCard, { backgroundColor: cardBg, borderColor }]}>
                <PlanetAvatar name={p.name} symbol="?" size={80} isDark={isDark} />
                <Text style={[styles.outerName, { color: textColor }]}>{p.name}</Text>
                <Text style={[styles.outerDesc, { color: secondaryText }]} numberOfLines={3}>{p.desc}</Text>
                <View style={styles.outerTraits}>
                  {p.traits.map((t) => (
                    <View key={t} style={[styles.outerTraitChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}>
                      <Text style={[styles.outerTraitText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)' }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Info box */}
          <View style={[styles.infoBox, { backgroundColor: cardBg, borderColor }]}>
            <InfoIcon size={16} color={ACCENT} />
            <Text style={[styles.infoText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Planetary hours follow the ancient Chaldean system. Today's astronomy photo is provided by NASA APOD API. Outer planets (Neptune, Uranus) are not part of the classical 7-planet cycle but influence long-term cosmic patterns.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: 14,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  notifBtn: {
    width: 40, height: 40, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Hero ──
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  heroImageWrap: {
    width: 130, height: 130,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
  },
  heroGlow: {
    position: 'absolute',
    width: 130, height: 130,
    borderRadius: 65,
    borderWidth: 2,
  },
  heroPlanetName: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  heroTime: { fontSize: 14, fontWeight: '600', marginBottom: 14 },
  heroPlanetDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 18 },
  heroChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  // ── Personal tip inside hero ──
  heroPersonal: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    width: '100%',
    gap: 6,
  },
  heroPersonalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroPersonalBadge: { fontSize: 12, fontWeight: '700' },
  heroPersonalTip: { fontSize: 13, lineHeight: 20 },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.lg, marginBottom: 12, marginTop: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },

  // ── Hour Cards Grid ──
  hourCardsGrid: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
    marginBottom: 20,
  },
  hourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    minHeight: 96,
  },
  hourCardInfo: { flex: 1, gap: 4 },
  hourCardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hourCardPlanet: { fontSize: 18, fontWeight: '700' },
  hourCardTime: { fontSize: 14, fontWeight: '500' },
  hourCardChips: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  hourCardChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  hourCardChipText: { fontSize: 12, fontWeight: '600' },
  nowBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  nowBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  // ── NASA APOD ──
  apodCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  apodImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
  },
  apodContent: {
    padding: 16,
    gap: 6,
  },
  apodBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apodBadge: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  apodTitle: { fontSize: 16, fontWeight: '700' },
  apodDesc: { fontSize: 13, lineHeight: 19 },

  // ── Outer Planets ──
  outerGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 12,
    marginBottom: 20,
  },
  outerCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  outerName: { fontSize: 16, fontWeight: '700' },
  outerDesc: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
  outerTraits: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: 4 },
  outerTraitChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  outerTraitText: { fontSize: 10, fontWeight: '600' },

  // ── Info ──
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: Spacing.lg, padding: 16,
    borderRadius: 16, borderWidth: 1, gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
