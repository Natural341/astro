// Horoscope Calendar — month grid + per-sign, per-date daily reading.
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { getZodiacSign } from '../utils/zodiac';
import { getDailyHoroscope } from '../utils/horoscope';
import { ChevronRightIcon, MagicStarIcon } from '../components/icons';

const { width } = Dimensions.get('window');

const DAY_NAMES: Record<string, string[]> = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};
const MONTH_NAMES: Record<string, string[]> = {
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const Ring: React.FC<{ score: number; label: string; color: string; textColor: string; subColor: string }> = ({ score, label, color, textColor, subColor }) => {
  const size = 64, stroke = 5, r = (size - stroke) / 2, c = r * 2 * Math.PI;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Circle stroke={color} fill="none" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeOpacity={0.15} />
          <Circle stroke={color} fill="none" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
            strokeDasharray={`${c} ${c}`} strokeDashoffset={c - (score / 100) * c} strokeLinecap="round"
            rotation="-90" origin={`${size / 2}, ${size / 2}`} />
        </Svg>
        <Text style={{ position: 'absolute', fontSize: 16, fontWeight: '700', color: textColor }}>{score}</Text>
      </View>
      <Text style={{ fontSize: 12, marginTop: 6, color: subColor }}>{label}</Text>
    </View>
  );
};

export const HoroscopeCalendarScreen: React.FC = () => {
  const { isDark, ui } = useTheme();
  const { t, language } = useTranslation();
  const user = useStore((s) => s.user);
  const sign = user?.zodiacSign || getZodiacSign(user?.birthDate);
  const lang = language === 'tr' ? 'tr' : 'en';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const horo = useMemo(() => getDailyHoroscope(sign, selectedDate), [sign, selectedDate]);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Mon-first
    const count = new Date(year, month + 1, 0).getDate();
    return { firstDay, count };
  }, [currentMonth]);

  const changeMonth = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const today = new Date();
  const cell = (width - 48) / 7;
  const accent = ui.primaryColor;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? 'transparent' : '#F6F6FA' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Month navigation */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={[styles.navBtn, { backgroundColor: ui.inputBg }]}>
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <ChevronRightIcon size={20} color={ui.textColor} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: ui.textColor }]}>
              {MONTH_NAMES[lang][currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={[styles.navBtn, { backgroundColor: ui.inputBg }]}>
              <ChevronRightIcon size={20} color={ui.textColor} />
            </TouchableOpacity>
          </View>

          {/* Weekday header */}
          <View style={styles.weekRow}>
            {DAY_NAMES[lang].map((d) => (
              <Text key={d} style={[styles.weekDay, { width: cell, color: ui.subTextColor }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {Array.from({ length: days.firstDay }).map((_, i) => <View key={`e${i}`} style={{ width: cell, height: cell }} />)}
            {Array.from({ length: days.count }).map((_, i) => {
              const dayNum = i + 1;
              const isSel = selectedDate.getDate() === dayNum && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
              const isToday = today.getDate() === dayNum && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
              return (
                <TouchableOpacity
                  key={dayNum}
                  style={{ width: cell, height: cell, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum));
                  }}
                >
                  <View style={[
                    styles.dayCircle,
                    isSel && { backgroundColor: accent },
                    !isSel && isToday && { borderWidth: 1.5, borderColor: accent },
                  ]}>
                    <Text style={{ color: isSel ? '#FFF' : ui.textColor, fontWeight: isSel || isToday ? '700' : '400' }}>{dayNum}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Horoscope card */}
          <View style={[styles.card, { backgroundColor: ui.cardBg, borderColor: ui.borderColor }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.08)' }]}>
                <MagicStarIcon size={22} color={accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.cardDate, { color: ui.textColor }]}>
                  {selectedDate.getDate()} {MONTH_NAMES[lang][selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </Text>
                <Text style={[styles.cardLabel, { color: ui.subTextColor }]}>{horo.signName} · {t('dailyHoroscopeSuffix')}</Text>
              </View>
              <View style={[styles.energyChip, { backgroundColor: `${accent}22` }]}>
                <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>{horo.energy}</Text>
              </View>
            </View>

            <Text style={[styles.message, { color: ui.textColor }]}>{horo.message}</Text>

            <View style={styles.ringsRow}>
              <Ring score={horo.loveScore} label={t('love')} color="#EC4899" textColor={ui.textColor} subColor={ui.subTextColor} />
              <Ring score={horo.careerScore} label={t('career')} color="#6366F1" textColor={ui.textColor} subColor={ui.subTextColor} />
              <Ring score={horo.healthScore} label={t('health')} color="#22C55E" textColor={ui.textColor} subColor={ui.subTextColor} />
            </View>

            <View style={styles.chipsRow}>
              <View style={[styles.chip, { borderColor: ui.borderColor }]}>
                <Text style={[styles.chipLabel, { color: ui.subTextColor }]}>{t('luckyColor')}</Text>
                <Text style={[styles.chipVal, { color: ui.textColor }]}>{horo.luckyColor}</Text>
              </View>
              <View style={[styles.chip, { borderColor: ui.borderColor }]}>
                <Text style={[styles.chipLabel, { color: ui.subTextColor }]}>{t('luckyNumber')}</Text>
                <Text style={[styles.chipVal, { color: ui.textColor }]}>{horo.luckyNumbers}</Text>
              </View>
              <View style={[styles.chip, { borderColor: ui.borderColor }]}>
                <Text style={[styles.chipLabel, { color: ui.subTextColor }]}>{t('element')}</Text>
                <Text style={[styles.chipVal, { color: ui.textColor }]}>{horo.element}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
  navBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: 18, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardDate: { fontSize: 16, fontWeight: '700' },
  cardLabel: { fontSize: 12, marginTop: 2 },
  energyChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  message: { fontSize: 14, lineHeight: 21, marginBottom: 18 },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  chipLabel: { fontSize: 10, marginBottom: 3 },
  chipVal: { fontSize: 13, fontWeight: '700' },
});
