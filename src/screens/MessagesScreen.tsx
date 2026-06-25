import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  VerifyIcon,
  SearchIcon,
  XIcon,
  StarIcon,
  PinIcon,
  ChatBubblesIcon,
  CompassIcon,
  PeopleIcon,
  AddCircleIcon,
  CheckCircleIcon,
} from '../components/icons';
import * as Haptics from 'expo-haptics';
import { Image as CachedImage } from 'expo-image';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { type DiscoverUser, type FriendshipStatus } from '../services/api';
import { useConversations, useDiscover, useSocialMutations } from '../hooks/social';
import { ASTROLOGERS } from '../data/astrologers';
import { Spacing } from '../config/theme';

const ACCENT = '#9D4EDD';

interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: any;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isTyping?: boolean;
  isAstrologer: boolean;
  isPinned?: boolean;
  hasConversation: boolean;
  primaryColor: string;
  systemPrompt?: string;
  astrologerId?: string;
  // Real users (people)
  isPerson?: boolean;
  userId?: string;
  friendshipStatus?: FriendshipStatus;
  friendshipId?: string | null;
}

const formatRelDate = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Avatar that falls back to an initial circle when there is no image or it fails
// to load (e.g. a stale uploaded-photo URL) — fixes blank avatars in the list.
const CardAvatar: React.FC<{ source: any; name: string; color: string }> = ({ source, name, color }) => {
  const [err, setErr] = useState(false);
  if (!source || err) {
    return (
      <View style={[styles.avatar, { backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '700' }}>{(name || '?').charAt(0).toUpperCase()}</Text>
      </View>
    );
  }
  return (
    <CachedImage
      source={source}
      style={styles.avatar}
      onError={() => setErr(true)}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={150}
    />
  );
};

// ─── Skeleton Shimmer ───────────────────────────────────────────
const useShimmer = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
};

const Bone: React.FC<{ w: number | string; h: number; r: number; color: string; opacity: Animated.AnimatedInterpolation<number>; style?: any }> =
  ({ w, h, r, color, opacity, style }) => (
    <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: color, opacity }, style]} />
  );

const SkeletonCard: React.FC<{ isDark: boolean; index: number }> = ({ isDark, index }) => {
  const opacity = useShimmer();
  const bone = isDark ? '#2D2D42' : '#DDDDE0';
  const boneLighter = isDark ? '#353550' : '#E8E8EB';
  const cardBg = isDark ? 'rgba(30,30,56,0.5)' : 'rgba(248,246,255,0.7)';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const nameW = [100, 130, 90, 115, 140, 105][index % 6];
  const msgW = ['92%', '80%', '88%', '75%', '95%', '70%'][index % 6];

  return (
    <View style={[skStyles.card, { backgroundColor: cardBg, borderColor: border }]}>
      <Bone w={58} h={58} r={29} color={bone} opacity={opacity} />
      <View style={skStyles.content}>
        <Bone w={nameW} h={14} r={7} color={bone} opacity={opacity} />
        <Bone w={70} h={10} r={5} color={boneLighter} opacity={opacity} />
        <Bone w={msgW} h={11} r={6} color={boneLighter} opacity={opacity} />
      </View>
    </View>
  );
};

const skStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, marginBottom: 10, borderWidth: 1, gap: 14 },
  content: { flex: 1, gap: 6 },
});

// ─── Typing Dots ────────────────────────────────────────────────
const TypingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#4ADE80',
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
      <Text style={{ fontSize: 12, color: '#4ADE80', fontWeight: '500', marginLeft: 3 }}>typing</Text>
    </View>
  );
};

// ─── Online Stories ─────────────────────────────────────────────
const StoryRing: React.FC<{
  astrologer: typeof ASTROLOGERS[0];
  onPress: () => void;
  isDark: boolean;
}> = ({ astrologer, onPress, isDark }) => (
  <TouchableOpacity style={storyStyles.item} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient
      colors={[astrologer.primaryColor, ACCENT, astrologer.primaryColor] as const}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={storyStyles.ring}
    >
      <View style={[storyStyles.avatarBorder, { backgroundColor: isDark ? '#0F0C24' : '#FFFFFF' }]}>
        <CachedImage source={astrologer.avatar} style={storyStyles.avatar} contentFit="cover" cachePolicy="memory-disk" />
      </View>
    </LinearGradient>
    <View style={storyStyles.onlineDot} />
    <View style={storyStyles.nameRow}>
      <Text
        style={[storyStyles.name, { color: isDark ? 'rgba(255,255,255,0.8)' : '#333' }]}
        numberOfLines={1}
      >
        {astrologer.name.split(' ')[0]}
      </Text>
      <VerifyIcon size={10} color="#3B82F6" />
    </View>
  </TouchableOpacity>
);

const storyStyles = StyleSheet.create({
  item: { alignItems: 'center', width: 76, marginRight: 4 },
  ring: { width: 64, height: 64, borderRadius: 32, padding: 2.5, justifyContent: 'center', alignItems: 'center' },
  avatarBorder: { width: 59, height: 59, borderRadius: 30, padding: 2, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 55, height: 55, borderRadius: 28 },
  onlineDot: {
    position: 'absolute', right: 10, top: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#0F0C24',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  name: { fontSize: 12, fontWeight: '600' },
});

// ═════════════════════════════════════════════════════════════════
export const MessagesScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { friends, addFriend, removeFriend } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'astrologers' | 'friends'>(
    route.params?.initialFilter === 'friends' ? 'friends' : 'all',
  );

  // Two server sources, cached + shared with PeopleScreen via React Query.
  const convsQ = useConversations();
  const peopleQ = useDiscover('');
  const { sendRequest, respondRequest, remove: removeFriendReq } = useSocialMutations();
  const refetchAll = useCallback(() => {
    convsQ.refetch();
    peopleQ.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bgColor = isDark ? 'transparent' : colors.background;
  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const cardBg = isDark ? 'rgba(30,30,56,0.5)' : 'rgba(248,246,255,0.7)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const inputBg = isDark ? 'rgba(30,30,48,0.6)' : 'rgba(244,244,248,0.8)';

  const onlineAstrologers = ASTROLOGERS.filter(a => a.isOnline);

  const buildMergedList = useCallback((backendConvs: Array<{ astrologer_name: string; last_message: string | null; last_message_at: string; id: string }>) => {
    const convByName = new Map(backendConvs.map(c => [c.astrologer_name, c]));
    const withConversation: Conversation[] = [];
    const withoutConversation: Conversation[] = [];

    for (const astrologer of ASTROLOGERS) {
      const existing = convByName.get(astrologer.name);
      if (existing) {
        withConversation.push({
          id: existing.id, name: astrologer.name, role: astrologer.title,
          avatar: astrologer.avatar, lastMessage: existing.last_message ?? 'Start a conversation...',
          time: formatRelDate(existing.last_message_at), unread: 0, isOnline: astrologer.isOnline,
          isAstrologer: true, isPinned: false, hasConversation: true,
          primaryColor: astrologer.primaryColor, systemPrompt: astrologer.systemPrompt,
          astrologerId: astrologer.id,
        });
      } else {
        withoutConversation.push({
          id: `new_${astrologer.id}`, name: astrologer.name, role: astrologer.title,
          avatar: astrologer.avatar, lastMessage: 'Tap to start a conversation',
          time: '', unread: 0, isOnline: astrologer.isOnline,
          isAstrologer: true, isPinned: false, hasConversation: false,
          primaryColor: astrologer.primaryColor, systemPrompt: astrologer.systemPrompt,
          astrologerId: astrologer.id,
        });
      }
    }

    withConversation.sort((a, b) => {
      if (a.time === 'Today' && b.time !== 'Today') return -1;
      if (b.time === 'Today' && a.time !== 'Today') return 1;
      return 0;
    });

    return [...withConversation, ...withoutConversation];
  }, []);

  // Real users → conversation cards (shown under the astrologers)
  const buildPeople = useCallback((people: DiscoverUser[]): Conversation[] =>
    people.map(u => ({
      id: `person_${u.id}`,
      userId: u.id,
      name: u.nickname,
      role: u.zodiac_sign || 'Member',
      avatar: u.profile_image_url ? { uri: u.profile_image_url } : null,
      lastMessage:
        u.friendship_status === 'friends' ? 'Tap to chat'
        : u.friendship_status === 'pending_in' ? 'Wants to be friends'
        : u.friendship_status === 'pending_out' ? 'Friend request sent'
        : 'Tap to chat · long-press to add friend',
      time: '', unread: 0, isOnline: u.online,
      isAstrologer: false, hasConversation: false,
      primaryColor: ACCENT,
      isPerson: true, friendshipStatus: u.friendship_status, friendshipId: u.friendship_id,
    })), []);

  // Merge backend conversations + discovered people into the unified list.
  const conversations = useMemo(
    () => [...buildMergedList(convsQ.data ?? []), ...buildPeople(peopleQ.data ?? [])],
    [convsQ.data, peopleQ.data, buildMergedList, buildPeople],
  );
  const loading = convsQ.isLoading || peopleQ.isLoading;

  useFocusEffect(useCallback(() => { refetchAll(); }, [refetchAll]));

  const filtered = conversations.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'friends') return matchSearch && (
      (!!c.astrologerId && friends.includes(c.astrologerId)) || friends.includes(c.id) ||
      (c.isPerson && c.friendshipStatus === 'friends')
    );
    if (filter === 'astrologers') return matchSearch && c.isAstrologer;
    return matchSearch;
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([convsQ.refetch(), peopleQ.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpen = (conv: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (conv.isPerson && conv.userId) {
      // Real user → open direct messages
      navigation.navigate('DirectChat', {
        userId: conv.userId, nickname: conv.name,
        avatar: conv.avatar?.uri ?? null,
      });
      return;
    }
    if (conv.isAstrologer) {
      navigation.navigate('AstrologerChat', {
        astrologer: {
          name: conv.name, title: conv.role, avatar: conv.avatar,
          primaryColor: conv.primaryColor, systemPrompt: conv.systemPrompt,
        },
      });
    }
  };

  // Direct action for the inline card button (no dialog). Mutations optimistically
  // update the shared discover cache, so this card re-derives instantly.
  const quickFriendAction = (conv: Conversation) => {
    if (!conv.userId) return;
    Haptics.selectionAsync();
    if (conv.friendshipStatus === 'none') {
      sendRequest.mutate(conv.userId);
    } else if (conv.friendshipStatus === 'pending_in' && conv.friendshipId) {
      respondRequest.mutate({ requestId: conv.friendshipId, accept: true });
    } else if (conv.friendshipStatus === 'pending_out') {
      removeFriendReq.mutate(conv.userId); // withdraw the pending request
    }
  };

  // Open a member's profile (passing the data we already have — no extra fetch).
  const openMemberProfile = (conv: Conversation) => {
    if (!conv.userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('MemberProfile', {
      userId: conv.userId, nickname: conv.name, avatar: conv.avatar?.uri ?? null,
      zodiac: conv.role, online: conv.isOnline,
      friendshipStatus: conv.friendshipStatus, friendshipId: conv.friendshipId,
    });
  };

  const handleStoryPress = (astrologer: typeof ASTROLOGERS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AstrologerChat', {
      astrologer: {
        name: astrologer.name, title: astrologer.title, avatar: astrologer.avatar,
        primaryColor: astrologer.primaryColor, systemPrompt: astrologer.systemPrompt,
      },
    });
  };

  const toggleFriend = (conv: Conversation) => {
    if (!conv.astrologerId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (friends.includes(conv.astrologerId)) {
      removeFriend(conv.astrologerId);
    } else {
      addFriend(conv.astrologerId);
    }
  };

  // ── Conversation Card ─────────────────────────────────────────
  const renderCard = ({ item: conv }: { item: Conversation }) => {
    const isFriend = conv.astrologerId ? friends.includes(conv.astrologerId) : false;
    return (
      <TouchableOpacity
        onPress={() => handleOpen(conv)}
        onLongPress={() => {
          if (!conv.isPerson && conv.astrologerId) {
            Alert.alert(
              isFriend ? 'Remove Friend' : 'Add Friend',
              `${isFriend ? 'Remove' : 'Add'} ${conv.name} ${isFriend ? 'from' : 'to'} your friends?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: isFriend ? 'Remove' : 'Add', onPress: () => toggleFriend(conv) },
              ]
            );
          }
        }}
        activeOpacity={0.75}
        style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      >
        {/* Avatar — tap for profile */}
        <TouchableOpacity
          style={styles.avatarWrap}
          activeOpacity={0.8}
          onPress={() => {
            if (conv.isPerson) {
              openMemberProfile(conv);
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const astrologer = ASTROLOGERS.find(a => a.id === conv.astrologerId);
            if (astrologer) {
              navigation.navigate('AstrologerProfile', { astrologer });
            }
          }}
        >
          {conv.isOnline ? (
            <LinearGradient
              colors={[conv.primaryColor, ACCENT, conv.primaryColor] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={[styles.avatarInner, { backgroundColor: isDark ? '#0F0C24' : '#FFF' }]}>
                <CardAvatar source={conv.avatar} name={conv.name} color={conv.primaryColor} />
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.avatarRingOff, { borderColor }]}>
              <CardAvatar source={conv.avatar} name={conv.name} color={conv.primaryColor} />
            </View>
          )}
          {conv.isOnline && (
            <View style={[styles.onlineDot, { borderColor: isDark ? '#0F0C24' : '#FFF' }]} />
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={styles.nameRow}>
              <Text style={[styles.convName, { color: textColor }]} numberOfLines={1}>{conv.name}</Text>
              {conv.isAstrologer && (
                <VerifyIcon size={14} color="#3B82F6" />
              )}
              {isFriend && (
                <View style={styles.friendBadge}>
                  <PeopleIcon size={9} color={ACCENT} />
                </View>
              )}
            </View>
            {conv.time !== '' && (
              <Text style={[styles.timeText, { color: conv.time === 'Today' ? ACCENT : secondaryText }]}>{conv.time}</Text>
            )}
          </View>
          <Text style={[styles.roleText, { color: secondaryText }]} numberOfLines={1}>{conv.role}</Text>
          <View style={styles.cardBottom}>
            {conv.isTyping ? (
              <TypingDots />
            ) : (
              <Text
                style={[
                  styles.lastMsg,
                  { color: conv.unread > 0 ? textColor : secondaryText },
                  conv.unread > 0 && styles.lastMsgBold,
                  !conv.hasConversation && { fontStyle: 'italic' },
                ]}
                numberOfLines={1}
              >
                {conv.lastMessage}
              </Text>
            )}
            {conv.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{conv.unread}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right-side friend action (real users only) */}
        {conv.isPerson && conv.friendshipStatus === 'none' && (
          <TouchableOpacity style={[styles.friendBtn, { backgroundColor: ACCENT }]} onPress={() => quickFriendAction(conv)}>
            <Text style={styles.friendBtnText}>{t('addFriendBtn')}</Text>
          </TouchableOpacity>
        )}
        {conv.isPerson && conv.friendshipStatus === 'pending_out' && (
          <TouchableOpacity style={[styles.friendBtn, styles.friendBtnGhost, { borderColor }]} onPress={() => quickFriendAction(conv)}>
            <Text style={[styles.friendBtnText, { color: secondaryText }]}>{t('cancelRequest')}</Text>
          </TouchableOpacity>
        )}
        {conv.isPerson && conv.friendshipStatus === 'pending_in' && (
          <TouchableOpacity style={[styles.friendBtn, { backgroundColor: '#22C55E' }]} onPress={() => quickFriendAction(conv)}>
            <Text style={styles.friendBtnText}>{t('acceptBtn')}</Text>
          </TouchableOpacity>
        )}
        {conv.isPerson && conv.friendshipStatus === 'friends' && (
          <View style={[styles.friendBtn, styles.friendBtnGhost, { borderColor: ACCENT }]}>
            <Text style={[styles.friendBtnText, { color: ACCENT }]}>{t('friendLabel')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── Sort: conversations with messages first, then online (green) on top ──
  const sorted = [...filtered].sort((a, b) => {
    // hasConversation first
    if (a.hasConversation && !b.hasConversation) return -1;
    if (!a.hasConversation && b.hasConversation) return 1;
    // Online (green dot) above offline within the same group
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    // Within hasConversation: Today > Yesterday > older
    if (a.hasConversation && b.hasConversation) {
      if (a.time === 'Today' && b.time !== 'Today') return -1;
      if (b.time === 'Today' && a.time !== 'Today') return 1;
      if (a.time === 'Yesterday' && b.time !== 'Yesterday' && b.time !== 'Today') return -1;
      if (b.time === 'Yesterday' && a.time !== 'Yesterday' && a.time !== 'Today') return 1;
    }
    return 0;
  });

  const existingConvs = sorted.filter(c => c.hasConversation);
  const newConvs = sorted.filter(c => !c.hasConversation);

  const listData: Array<Conversation | { type: 'section_header'; label: string }> = [];
  existingConvs.forEach(c => listData.push(c));
  if (newConvs.length > 0 && existingConvs.length > 0) {
    listData.push({ type: 'section_header', label: 'Start a Conversation' } as any);
  }
  newConvs.forEach(c => listData.push(c));

  const FILTERS = [
    { key: 'all' as const, label: 'All' },
    { key: 'astrologers' as const, label: 'Astrologers', icon: StarIcon },
    { key: 'friends' as const, label: 'Friends', icon: PeopleIcon },
  ];

  // ── List Header (stories + search + filters) ───────────────
  const ListHeader = () => (
    <View>
      {/* Online Stories */}
      {onlineAstrologers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesRow}
        >
          {onlineAstrologers.map(a => (
            <StoryRing key={a.id} astrologer={a} onPress={() => handleStoryPress(a)} isDark={isDark} />
          ))}
        </ScrollView>
      )}

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor }]}>
        <SearchIcon size={18} color={secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search..."
          placeholderTextColor={secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <XIcon size={17} color={secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, { backgroundColor: active ? ACCENT : inputBg }]}
              onPress={() => setFilter(f.key)}
            >
              {f.icon && <f.icon size={13} color={active ? '#FFF' : secondaryText} />}
              <Text style={[styles.filterChipText, { color: active ? '#FFF' : secondaryText }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const EmptyList = () => (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(157,78,221,0.1)' : 'rgba(157,78,221,0.08)' }]}>
        {filter === 'friends'
          ? <PeopleIcon size={48} color={isDark ? 'rgba(157,78,221,0.6)' : 'rgba(157,78,221,0.5)'} />
          : <ChatBubblesIcon size={48} color={isDark ? 'rgba(157,78,221,0.6)' : 'rgba(157,78,221,0.5)'} />
        }
      </View>
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        {filter === 'friends'
          ? 'No friends yet'
          : searchQuery ? 'No conversations found' : 'No conversations yet'}
      </Text>
      <Text style={[styles.emptyText, { color: secondaryText }]}>
        {filter === 'friends'
          ? 'Long press on any astrologer to add them as a friend'
          : searchQuery ? 'Try a different search term' : 'Start chatting with an astrologer to get cosmic guidance'}
      </Text>
      {!searchQuery && filter !== 'friends' && (
        <TouchableOpacity
          style={styles.emptyCTA}
          onPress={() => navigation.navigate('Astrologers')}
          activeOpacity={0.8}
        >
          <CompassIcon size={16} color="#FFF" />
          <Text style={styles.emptyCTAText}>Browse Astrologers</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {loading ? (
          <FlatList
            data={[0, 1, 2, 3, 4, 5]}
            keyExtractor={(i) => String(i)}
            renderItem={({ item }) => <SkeletonCard isDark={isDark} index={item} />}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item: any) => item.id || item.label}
            renderItem={({ item }: any) => {
              if (item.type === 'section_header') {
                return <Text style={[styles.sectionLabel, { color: secondaryText }]}>{item.label}</Text>;
              }
              return renderCard({ item });
            }}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={EmptyList}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Stories — no extra paddingHorizontal since FlatList's contentContainerStyle already adds Spacing.lg
  storiesRow: {
    paddingTop: 10,
    paddingBottom: 16,
    gap: 4,
    // negative margin to stretch full width, then padding to align first item with cards
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },

  friendBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginLeft: 8, alignSelf: 'center' },
  friendBtnGhost: { backgroundColor: 'transparent', borderWidth: 1 },
  friendBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },

  listContent: { paddingHorizontal: Spacing.lg },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    gap: 14,
  },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarRing: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarRingOff: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  onlineDot: {
    position: 'absolute', right: 0, bottom: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4ADE80', borderWidth: 2.5,
  },

  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  convName: { fontSize: 16, fontWeight: '700' },
  friendBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(157,78,221,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  timeText: { fontSize: 12, fontWeight: '600', flexShrink: 0 },
  roleText: { fontSize: 12, marginBottom: 4 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lastMsg: { flex: 1, fontSize: 13, lineHeight: 18 },
  lastMsgBold: { fontWeight: '600' },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: ACCENT,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.5, marginTop: 16, marginBottom: 10,
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyCTA: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 14, marginTop: 8,
  },
  emptyCTAText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
