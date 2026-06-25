import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TickCircleIcon, ArrowCircleLeftIcon, BellSlashIcon, XIcon, FlameIcon, BellIcon } from '../components/icons';
import { Avatar } from '../components/Avatar';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing } from '../config/theme';
import { ApiNotification } from '../services/api';
import { useNotifications, useSocialMutations } from '../hooks/social';

// ─── Type → icon mapping ────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; SvgIcon?: React.FC<any>; color: string }> = {
  application_approved: { icon: 'checkmark-circle', color: '#4CAF50' },
  application_rejected: { icon: 'close-circle', SvgIcon: XIcon, color: '#F44336' },
  new_message: { icon: 'chatbubble', color: '#9D4EDD' },
  friend_request: { icon: 'person-add', color: '#3B82F6' },
  friend_accepted: { icon: 'people', color: '#22C55E' },
  streak_reminder: { icon: 'flame', SvgIcon: FlameIcon, color: '#FF9800' },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIG[type] ?? { icon: 'notifications' as keyof typeof Ionicons.glyphMap, SvgIcon: BellIcon, color: '#9D4EDD' };

// ─── Relative time helper ────────────────────────────────────────────────────
const formatRelDate = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export const NotificationsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const notificationsQ = useNotifications(50);
  const { respondRequest, markAllRead } = useSocialMutations();
  const notifications = notificationsQ.data ?? [];
  const loading = notificationsQ.isLoading;
  const [refreshing, setRefreshing] = useState(false);
  // Instant local feedback per request — the notification card itself isn't a
  // friend-request record, so we track responded ids to swap the buttons at once.
  const [responded, setResponded] = useState<Record<string, 'accepted' | 'rejected'>>({});

  const respondToRequest = (requestId: string, accept: boolean) => {
    Haptics.selectionAsync();
    setResponded(prev => ({ ...prev, [requestId]: accept ? 'accepted' : 'rejected' }));
    respondRequest.mutate({ requestId, accept });
  };

  useFocusEffect(
    useCallback(() => {
      notificationsQ.refetch();
      markAllRead.mutate(); // clears the home badge; list stays highlighted this view
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await notificationsQ.refetch();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const bgColor = isDark ? 'transparent' : '#F2EEF8';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : '#8E8E93';
  const headerBg = isDark ? '#13131F' : '#FFFFFF';

  const renderNotification = (notif: ApiNotification) => {
    const cfg = getTypeConfig(notif.type);

    // Parse the JSON payload (sender id/nickname/avatar/request id) when present.
    let payload: any = {};
    try { payload = notif.data ? JSON.parse(notif.data) : {}; } catch { payload = {}; }
    const isFriendReq = notif.type === 'friend_request' && payload.user_id;
    const isPersonNotif = (notif.type === 'friend_request' || notif.type === 'friend_accepted' || notif.type === 'new_message') && payload.user_id;

    const openProfile = () => {
      if (!payload.user_id) return;
      navigation.navigate('MemberProfile', {
        userId: payload.user_id, nickname: payload.nickname, avatar: payload.avatar || null,
        friendshipStatus: notif.type === 'friend_request' ? 'pending_in' : 'none',
        friendshipId: payload.request_id || null,
      });
    };

    const localizedText = notif.type === 'friend_request'
      ? `${payload.nickname || ''} ${t('wantsToBeFriends')}`
      : notif.body;

    return (
      <TouchableOpacity
        key={notif.id}
        activeOpacity={isPersonNotif ? 0.7 : 1}
        onPress={isPersonNotif ? openProfile : undefined}
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: notif.is_read ? cardBorder : `${cfg.color}40` },
        ]}
      >
        {isPersonNotif ? (
          <Avatar uri={payload.avatar} name={payload.nickname || '?'} color={cfg.color} />
        ) : (
          <View style={[styles.iconBox, { backgroundColor: `${cfg.color}15` }]}>
            {notif.type === 'application_approved' ? (
              <TickCircleIcon size={22} color={cfg.color} />
            ) : cfg.SvgIcon ? (
              <cfg.SvgIcon size={22} color={cfg.color} />
            ) : (
              <Ionicons name={cfg.icon} size={22} color={cfg.color} />
            )}
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: textPrimary }]} numberOfLines={1}>
              {notif.title}
            </Text>
            {!notif.is_read && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}
          </View>
          {localizedText ? (
            <Text style={[styles.cardBody, { color: textSecondary }]} numberOfLines={2}>
              {localizedText}
            </Text>
          ) : null}
          <Text style={[styles.cardTime, { color: isDark ? 'rgba(255,255,255,0.35)' : '#C7C7CC' }]}>
            {formatRelDate(notif.created_at)}
          </Text>

          {/* Inline Accept / Reject for incoming friend requests.
              Once responded, swap to an instant status pill. */}
          {isFriendReq && payload.request_id && (
            responded[payload.request_id] ? (
              <View style={styles.actionRow}>
                <View style={[styles.statusPill, { backgroundColor: responded[payload.request_id] === 'accepted' ? '#22C55E20' : `${cardBorder}` }]}>
                  <Text style={[styles.statusText, { color: responded[payload.request_id] === 'accepted' ? '#22C55E' : textSecondary }]}>
                    {responded[payload.request_id] === 'accepted' ? t('accepted') : t('rejected')}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actBtn, { backgroundColor: '#22C55E' }]}
                  onPress={() => respondToRequest(payload.request_id, true)}
                >
                  <Text style={styles.actBtnText}>{t('acceptBtn')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actBtn, styles.actBtnGhost, { borderColor: cardBorder }]}
                  onPress={() => respondToRequest(payload.request_id, false)}
                >
                  <Text style={[styles.actBtnText, { color: textSecondary }]}>{t('rejectBtn')}</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: cardBorder }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}
          >
            <ArrowCircleLeftIcon size={18} color={textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>{t('notifications')}</Text>
            {unreadCount > 0 && (
              <Text style={[styles.headerSub, { color: textSecondary }]}>
                {unreadCount} {t('unread')}
              </Text>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#9D4EDD" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <BellSlashIcon size={48} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>{t('noNotificationsYet')}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9D4EDD" />
            }
          >
            {notifications.map(renderNotification)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 10,
    borderRadius: 12,
  },
  headerTitles: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 16,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
  actBtnGhost: { backgroundColor: 'transparent', borderWidth: 1 },
  actBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  statusPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  statusText: { fontSize: 13, fontWeight: '700' },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  cardBody: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    marginTop: 6,
  },
});
