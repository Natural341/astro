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
import { ChevronRightIcon } from '../components/icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing } from '../config/theme';
import { getMyConversations, AstrologerConversation } from '../services/api';

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

export const AstrologerRequestsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<AstrologerConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getMyConversations();
      setConversations(res.data ?? []);
    } catch {
      setConversations([]);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const bgColor = isDark ? 'transparent' : '#F2EEF8';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : '#8E8E93';
  const headerBg = isDark ? '#13131F' : '#FFFFFF';

  const getInitial = (name: string) => (name?.charAt(0) || 'U').toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: cardBorder }]}>
          <Ionicons name="chatbubbles" size={24} color="#9D4EDD" />
          <Text style={[styles.headerTitle, { color: textPrimary }]}>{t('clientMessages')}</Text>
          <Text style={[styles.headerCount, { color: textSecondary }]}>
            {conversations.length} conversations
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#9D4EDD" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              No messages from clients yet
            </Text>
            <Text style={[styles.emptySubtext, { color: textSecondary }]}>
              When users message you, they will appear here
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9D4EDD" />
            }
          >
            {conversations.map(conv => (
              <TouchableOpacity
                key={conv.id}
                style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('AstrologerChatReply', {
                    conversationId: conv.id,
                    nickname: conv.nickname,
                    avatar: conv.avatar,
                  });
                }}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: '#9D4EDD' }]}>
                  <Text style={styles.avatarText}>{getInitial(conv.nickname)}</Text>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardName, { color: textPrimary }]} numberOfLines={1}>
                      {conv.nickname}
                    </Text>
                    <Text style={[styles.cardTime, { color: textSecondary }]}>
                      {formatRelDate(conv.last_message_at)}
                    </Text>
                  </View>
                  <Text style={[styles.cardMsg, { color: textSecondary }]} numberOfLines={2}>
                    {conv.last_message || 'No messages yet'}
                  </Text>
                </View>

                <ChevronRightIcon size={18} color={textSecondary} />
              </TouchableOpacity>
            ))}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  headerCount: {
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  cardTime: {
    fontSize: 11,
    marginLeft: 8,
  },
  cardMsg: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
