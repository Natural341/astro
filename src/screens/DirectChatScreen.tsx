// Direct chat — user ↔ user messaging.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowCircleLeftIcon } from '../components/icons';
import { getDMMessages, sendDM, type DMMessage } from '../services/api';

export const DirectChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, nickname } = route.params || {};
  const { ui, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const res = await getDMMessages(userId);
      setMessages(res.data || []);
    } catch { /* keep previous */ }
  }, [userId]);

  // Initial load + light polling so the other person's replies show up.
  useFocusEffect(useCallback(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]));

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // optimistic
    const optimistic: DMMessage = { id: `tmp_${content.length}_${messages.length}`, content, is_mine: true, created_at: '' };
    setMessages(prev => [...prev, optimistic]);
    try {
      await sendDM(userId, content);
      await load();
    } catch {
      // revert on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: DMMessage }) => (
    <View style={[styles.bubbleRow, { justifyContent: item.is_mine ? 'flex-end' : 'flex-start' }]}>
      <View style={[
        styles.bubble,
        item.is_mine
          ? { backgroundColor: ui.primaryColor, borderBottomRightRadius: 4 }
          : { backgroundColor: ui.inputBg, borderBottomLeftRadius: 4 },
      ]}>
        <Text style={{ color: item.is_mine ? '#FFF' : ui.textColor, fontSize: 15 }}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? 'transparent' : '#FAFAFA' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[styles.header, { borderColor: ui.borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}>
            <ArrowCircleLeftIcon size={24} color={ui.textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: ui.textColor }]} numberOfLines={1}>{nickname || 'Chat'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: messages.length ? 'flex-end' : 'center' }}
            ListEmptyComponent={<Text style={{ color: ui.subTextColor, textAlign: 'center' }}>{t('sayHello')}</Text>}
          />
          <View style={[styles.inputBar, { borderColor: ui.borderColor, paddingBottom: Math.max(insets.bottom, 10) }]}>
            <TextInput
              style={[styles.input, { backgroundColor: ui.inputBg, color: ui.textColor }]}
              placeholder={t('messagePh')}
              placeholderTextColor={ui.subTextColor}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: text.trim() ? ui.primaryColor : ui.borderColor }]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              <Text style={styles.sendText}>{t('send')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', marginVertical: 3 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15 },
  sendBtn: { paddingHorizontal: 18, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
