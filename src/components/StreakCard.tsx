// Streak Claim Card Component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TickCircleIcon, GiftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';
import { Spacing, BorderRadius, FontSizes } from '../config/theme';
import { claimDailyStreak, getStreak } from '../services/api';

export const StreakCard: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user, streak, setStreak, updateUser } = useStore();

  const [canClaim, setCanClaim] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const scaleAnim = new Animated.Value(1);

  // On mount: sync streak from backend (source of truth) so a sign-out/in can't
  // reset lastClaimDate locally and re-enable the claim button (no daily farming).
  useEffect(() => {
    const guest = !user?.id || user.id.startsWith('guest_') || user.id.startsWith('local_');
    if (guest) return;
    getStreak()
      .then(s => setStreak({
        currentStreak: s.current_streak,
        longestStreak: s.longest_streak,
        lastClaimDate: s.last_claim_date,
        totalTokensEarned: s.total_tokens_earned,
      }))
      .catch(() => {});
  }, []);

  // On mount + after streak changes: check if claimable
  useEffect(() => {
    checkCanClaim();
  }, [streak.lastClaimDate]);

  const checkCanClaim = () => {
    if (!streak?.lastClaimDate) {
      setCanClaim(true);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const lastClaimDay = new Date(streak.lastClaimDate).toISOString().split('T')[0];
    setCanClaim(today !== lastClaimDay);
  };

  const handleClaim = async () => {
    if (!canClaim || isAnimating) return;

    setIsAnimating(true);
    setCanClaim(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    // Compute optimistic values
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const lastStr = streak.lastClaimDate
      ? new Date(streak.lastClaimDate).toISOString().split('T')[0]
      : null;
    const optimisticStreak = lastStr === yesterdayStr
      ? (streak.currentStreak || 0) + 1
      : 1;
    const optimisticReward = 10;

    try {
      // Backend is the source of truth: it enforces once-per-day and awards tokens
      // server-side. We only mirror its confirmed values — never grant tokens locally.
      const res = await claimDailyStreak();

      const newStreak = res.new_streak || optimisticStreak;
      setStreak({
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, res.longest_streak || streak.longestStreak || 0),
        lastClaimDate: today.toISOString(),
        totalTokensEarned: (streak.totalTokensEarned || 0) + (res.tokens_awarded || 0),
      });
      // token_balance is authoritative — set it, don't add (prevents drift/farming).
      if (typeof res.token_balance === 'number') {
        updateUser({ tokens: res.token_balance });
      }
    } catch (e: any) {
      // "Already claimed today" (HTTP 409) or any error → do NOT grant tokens.
      // Re-sync truth from the backend so the button reflects reality.
      setCanClaim(false);
      getStreak().then(updated => {
        setStreak({
          currentStreak: updated.current_streak,
          longestStreak: updated.longest_streak,
          lastClaimDate: updated.last_claim_date,
          totalTokensEarned: updated.total_tokens_earned,
        });
      }).catch(() => {});
    }

    setTimeout(() => setIsAnimating(false), 1000);
  };

  const safeStreak = streak.currentStreak || 0;
  const modStreak = safeStreak % 7;
  const activeCount = modStreak === 0 && safeStreak > 0 ? 7 : modStreak;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={isDark ? ['rgba(168,85,247,0.75)', 'rgba(124,58,237,0.7)', 'rgba(109,40,217,0.65)'] : ['#A855F7', '#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Left - Fire Icon & Streak Count */}
            <View style={styles.leftSection}>
              <View style={styles.fireContainer}>
                <Image source={require('../../assets/images/fire.png')} style={styles.fireImage} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.streakNumber}>{safeStreak}</Text>
                <Text style={styles.streakLabel}>{t('streakDays')}</Text>
              </View>
            </View>

            {/* Right - Claim Button */}
            <TouchableOpacity
              onPress={handleClaim}
              disabled={!canClaim}
              style={[styles.claimButton, !canClaim && styles.claimButtonDisabled]}
            >
              {canClaim ? (
                <GiftIcon size={20} color="#7C3AED" />
              ) : (
                <TickCircleIcon size={20} color="#FFFFFF" />
              )}
              <Text style={[styles.claimButtonText, !canClaim && styles.claimButtonTextDisabled]}>
                {canClaim ? t('claimReward') : t('rewardClaimed')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Day indicators */}
          <View style={styles.daysContainer}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isActive = day <= activeCount;
              return (
                <View
                  key={day}
                  style={[styles.dayDot, isActive ? styles.dayDotActive : styles.dayDotInactive]}
                >
                  <Text style={[styles.dayText, !isActive && { color: 'rgba(255,255,255,0.5)' }]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: { padding: Spacing.lg },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fireContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireImage: { width: 34, height: 34 },
  streakNumber: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  streakLabel: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  claimButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.2)' },
  claimButtonText: { color: '#7C3AED', fontWeight: 'bold', fontSize: FontSizes.sm },
  claimButtonTextDisabled: { color: '#FFFFFF' },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotActive: { backgroundColor: '#FFFFFF' },
  dayDotInactive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  dayText: { fontSize: FontSizes.sm, fontWeight: 'bold', color: '#7C3AED' },
});
