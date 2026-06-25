// Member profile — view another user, add friend, or open DM.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowCircleLeftIcon } from '../components/icons';
import { sendFriendRequest, respondFriendRequest, removeFriend, blockUser, unblockUser, type FriendshipStatus } from '../services/api';

export const MemberProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ui, isDark } = useTheme();
  const { t } = useTranslation();
  const { userId, nickname, avatar, zodiac, online, friendshipId } = route.params || {};

  const [status, setStatus] = useState<FriendshipStatus>(route.params?.friendshipStatus || 'none');
  const [imgErr, setImgErr] = useState(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(route.params?.blocked === true);

  const toggleBlock = () => {
    Haptics.selectionAsync();
    if (isBlocked) {
      setIsBlocked(false);
      unblockUser(userId).catch(() => setIsBlocked(true));
    } else {
      setIsBlocked(true);
      setStatus('none');
      blockUser(userId).catch(() => setIsBlocked(false));
    }
  };

  const handleFriend = () => {
    Haptics.selectionAsync();
    if (status === 'none') {
      setStatus('pending_out');
      sendFriendRequest(userId).catch(() => setStatus('none'));
    } else if (status === 'pending_in' && friendshipId) {
      setStatus('friends');
      respondFriendRequest(friendshipId, true).catch(() => setStatus('pending_in'));
    } else if (status === 'pending_out') {
      // Withdraw the request
      setStatus('none');
      removeFriend(userId).catch(() => setStatus('pending_out'));
    }
  };

  const friendLabel = status === 'friends' ? 'Friends'
    : status === 'pending_out' ? 'Withdraw Request'
    : status === 'pending_in' ? 'Accept Request'
    : 'Add Friend';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? 'transparent' : '#FAFAFA' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}>
            <ArrowCircleLeftIcon size={24} color={ui.textColor} />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          {avatar && !imgErr ? (
            <Image source={{ uri: avatar }} style={styles.avatar} onError={() => setImgErr(true)} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: ui.primaryColor, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#FFF', fontSize: 40, fontWeight: '700' }}>{(nickname || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={[styles.name, { color: ui.textColor }]}>{nickname}</Text>
          <Text style={[styles.sub, { color: ui.subTextColor }]}>
            {online ? '● Online' : 'Offline'}{zodiac ? ` · ${zodiac}` : ''}
          </Text>

          {!isBlocked && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, status === 'pending_out' ? [styles.btnGhost, { borderColor: ui.borderColor }] : { backgroundColor: status === 'friends' ? ui.borderColor : ui.primaryColor }]}
                onPress={handleFriend}
                disabled={status === 'friends'}
              >
                <Text style={[styles.btnText, status === 'pending_out' && { color: ui.subTextColor }]}>{friendLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost, { borderColor: ui.primaryColor }]}
                onPress={() => navigation.navigate('DirectChat', { userId, nickname, avatar })}
              >
                <Text style={[styles.btnText, { color: ui.primaryColor }]}>{t('messages')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Block / Unblock */}
          <TouchableOpacity style={styles.blockBtn} onPress={toggleBlock}>
            <Text style={[styles.blockText, { color: isBlocked ? ui.primaryColor : '#EF4444' }]}>
              {isBlocked ? t('unblock') : t('block')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  hero: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 24 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  name: { fontSize: 24, fontWeight: '800', marginTop: 16 },
  sub: { fontSize: 14, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28, width: '100%' },
  btn: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  blockBtn: { marginTop: 22, paddingVertical: 8 },
  blockText: { fontSize: 14, fontWeight: '600' },
});
