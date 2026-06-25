// People — discover users, manage friend requests, open DMs.
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { ArrowCircleLeftIcon } from '../components/icons';
import { Avatar } from '../components/Avatar';
import { useTranslation } from '../hooks/useTranslation';
import { type DiscoverUser, type FriendUser, type FriendRequest } from '../services/api';
import {
  useFriends, useFriendRequests, useBlocked, useDiscover, useSocialMutations,
} from '../hooks/social';

type Tab = 'friends' | 'discover' | 'requests' | 'blocked';

export const PeopleScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { ui, isDark } = useTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('discover');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Server data via React Query — cached, deduped and shared with other screens.
  const friendsQ = useFriends();
  const requestsQ = useFriendRequests();
  const blockedQ = useBlocked();
  const discoverQ = useDiscover(query);
  const { sendRequest, respondRequest, unblock } = useSocialMutations();

  const friends = friendsQ.data ?? [];
  const requests = requestsQ.data ?? [];
  const blocked = blockedQ.data ?? [];
  const discover = discoverQ.data ?? [];
  const loading =
    friendsQ.isLoading || requestsQ.isLoading || blockedQ.isLoading || discoverQ.isLoading;

  // Re-fetch everything when the screen regains focus (refetch refs are stable).
  useFocusEffect(
    useCallback(() => {
      friendsQ.refetch();
      requestsQ.refetch();
      blockedQ.refetch();
      discoverQ.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onSearch = (text: string) => setQuery(text);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      friendsQ.refetch(), requestsQ.refetch(), blockedQ.refetch(), discoverQ.refetch(),
    ]);
    setRefreshing(false);
  };

  const handleUnblock = (u: FriendUser) => { Haptics.selectionAsync(); unblock.mutate(u.id); };
  const handleAdd = (u: DiscoverUser) => { Haptics.selectionAsync(); sendRequest.mutate(u.id); };
  const handleRespond = (req: FriendRequest, accept: boolean) => {
    Haptics.selectionAsync();
    respondRequest.mutate({ requestId: req.request_id, accept });
  };

  const openDM = (userId: string, nickname: string, avatar?: string | null) => {
    navigation.navigate('DirectChat', { userId, nickname, avatar });
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'friends', label: `${t('friends')}${friends.length ? ` (${friends.length})` : ''}` },
    { key: 'discover', label: t('discover') },
    { key: 'requests', label: `${t('requests')}${requests.length ? ` (${requests.length})` : ''}` },
    { key: 'blocked', label: `${t('blocked')}${blocked.length ? ` (${blocked.length})` : ''}` },
  ];

  const renderBlocked = ({ item }: { item: FriendUser }) => (
    <View style={[styles.row, { borderColor: ui.borderColor }]}>
      <View style={styles.rowLeft}>
        <Avatar uri={item.profile_image_url} name={item.nickname} />
        <View style={styles.rowInfo}>
          <Text style={[styles.name, { color: ui.textColor }]}>{item.nickname}</Text>
          <Text style={[styles.sub, { color: ui.subTextColor }]}>{t('blocked')}</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.actionBtn, styles.actionGhost, { borderColor: ui.primaryColor }]} onPress={() => handleUnblock(item)}>
        <Text style={[styles.actionText, { color: ui.primaryColor }]}>{t('unblock')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDiscover = ({ item }: { item: DiscoverUser }) => (
    <View style={[styles.row, { borderColor: ui.borderColor }]}>
      <TouchableOpacity style={styles.rowLeft} activeOpacity={0.7}
        onPress={() => item.friendship_status === 'friends' ? openDM(item.id, item.nickname, item.profile_image_url) : undefined}>
        <Avatar uri={item.profile_image_url} name={item.nickname} online={item.online} />
        <View style={styles.rowInfo}>
          <Text style={[styles.name, { color: ui.textColor }]}>{item.nickname}</Text>
          <Text style={[styles.sub, { color: ui.subTextColor }]}>
            {item.online ? 'Online' : 'Offline'}{item.zodiac_sign ? ` · ${item.zodiac_sign}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
      {item.friendship_status === 'none' && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ui.primaryColor }]} onPress={() => handleAdd(item)}>
          <Text style={styles.actionText}>Add</Text>
        </TouchableOpacity>
      )}
      {item.friendship_status === 'pending_out' && (
        <View style={[styles.actionBtn, styles.actionGhost, { borderColor: ui.borderColor }]}>
          <Text style={[styles.actionText, { color: ui.subTextColor }]}>Pending</Text>
        </View>
      )}
      {item.friendship_status === 'pending_in' && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
          onPress={() => { const r = requests.find(x => x.id === item.id); if (r) handleRespond(r, true); }}>
          <Text style={styles.actionText}>Accept</Text>
        </TouchableOpacity>
      )}
      {item.friendship_status === 'friends' && (
        <TouchableOpacity style={[styles.actionBtn, styles.actionGhost, { borderColor: ui.primaryColor }]}
          onPress={() => openDM(item.id, item.nickname, item.profile_image_url)}>
          <Text style={[styles.actionText, { color: ui.primaryColor }]}>Message</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFriend = ({ item }: { item: FriendUser }) => (
    <TouchableOpacity style={[styles.row, { borderColor: ui.borderColor }]} activeOpacity={0.7}
      onPress={() => openDM(item.id, item.nickname, item.profile_image_url)}>
      <View style={styles.rowLeft}>
        <Avatar uri={item.profile_image_url} name={item.nickname} online={item.online} />
        <View style={styles.rowInfo}>
          <Text style={[styles.name, { color: ui.textColor }]}>{item.nickname}</Text>
          <Text style={[styles.sub, { color: ui.subTextColor }]}>
            {item.online ? 'Online' : 'Offline'}{item.zodiac_sign ? ` · ${item.zodiac_sign}` : ''}
          </Text>
        </View>
      </View>
      <Text style={[styles.actionText, { color: ui.primaryColor }]}>Message</Text>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.row, { borderColor: ui.borderColor }]}>
      <View style={styles.rowLeft}>
        <Avatar uri={item.profile_image_url} name={item.nickname} />
        <View style={styles.rowInfo}>
          <Text style={[styles.name, { color: ui.textColor }]}>{item.nickname}</Text>
          <Text style={[styles.sub, { color: ui.subTextColor }]}>wants to be friends</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22C55E' }]} onPress={() => handleRespond(item, true)}>
          <Text style={styles.actionText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionGhost, { borderColor: ui.borderColor }]} onPress={() => handleRespond(item, false)}>
          <Text style={[styles.actionText, { color: ui.subTextColor }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const data = tab === 'friends' ? friends : tab === 'discover' ? discover : tab === 'blocked' ? blocked : requests;
  const emptyText = tab === 'friends' ? 'No friends yet. Find people in Discover.'
    : tab === 'requests' ? 'No friend requests.' : tab === 'blocked' ? 'No blocked users.' : 'No users found.';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? 'transparent' : '#FAFAFA' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}>
            <ArrowCircleLeftIcon size={24} color={ui.textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: ui.textColor }]}>People</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.tabs, { backgroundColor: ui.inputBg }]}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && { backgroundColor: ui.primaryColor }]}
              onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}>
              <Text style={[styles.tabText, { color: tab === t.key ? '#FFF' : ui.subTextColor }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'discover' && (
          <TextInput
            style={[styles.search, { backgroundColor: ui.inputBg, color: ui.textColor, borderColor: ui.borderColor }]}
            placeholder="Search by username..."
            placeholderTextColor={ui.subTextColor}
            value={query}
            onChangeText={onSearch}
            autoCapitalize="none"
          />
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={ui.primaryColor} />
        ) : (
          <FlatList
            data={data as any[]}
            keyExtractor={(item: any) => item.request_id || item.id}
            renderItem={(tab === 'friends' ? renderFriend : tab === 'requests' ? renderRequest : tab === 'blocked' ? renderBlocked : renderDiscover) as any}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.primaryColor} />}
            ListEmptyComponent={<Text style={[styles.empty, { color: ui.subTextColor }]}>{emptyText}</Text>}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, padding: 4, borderRadius: 14, gap: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  search: { marginHorizontal: 16, marginTop: 12, height: 46, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  rowInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 2 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  actionGhost: { backgroundColor: 'transparent', borderWidth: 1 },
  actionText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 48, fontSize: 14 },
});
