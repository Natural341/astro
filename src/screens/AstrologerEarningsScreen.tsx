import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WalletIcon, AlertIcon } from '../components/icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing } from '../config/theme';
import { getMyEarnings, AstrologerEarnings } from '../services/api';

export const AstrologerEarningsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [data, setData] = useState<AstrologerEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getMyEarnings();
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const bgColor = isDark ? 'transparent' : '#F2EEF8';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : '#8E8E93';
  const headerBg = isDark ? '#13131F' : '#FFFFFF';

  const stats: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string }[] = data
    ? [
        { icon: 'people', label: 'Total Clients', value: data.total_clients, color: '#9D4EDD' },
        { icon: 'chatbubbles', label: 'Messages Received', value: data.total_messages, color: '#4CAF50' },
        { icon: 'send', label: 'Replies Sent', value: data.total_replies, color: '#2196F3' },
      ]
    : [];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: cardBorder }]}>
          <WalletIcon size={24} color="#9D4EDD" />
          <Text style={[styles.headerTitle, { color: textPrimary }]}>{t('earnings')}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#9D4EDD" />
          </View>
        ) : !data ? (
          <View style={styles.center}>
            <AlertIcon size={48} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              Could not load earnings data
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchData(); }}
                tintColor="#9D4EDD"
              />
            }
          >
            {/* Stat cards */}
            {stats.map((s, i) => (
              <View key={i} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.iconBox, { backgroundColor: `${s.color}15` }]}>
                  <Ionicons name={s.icon} size={24} color={s.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardLabel, { color: textSecondary }]}>{s.label}</Text>
                  <Text style={[styles.cardValue, { color: textPrimary }]}>{s.value}</Text>
                </View>
              </View>
            ))}

            {/* Coming soon note */}
            <View style={[styles.noteCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name="information-circle-outline" size={20} color={textSecondary} />
              <Text style={[styles.noteText, { color: textSecondary }]}>
                Revenue tracking and payout features are coming soon. For now, track your activity here.
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  emptyText: { fontSize: 15 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    marginLeft: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
