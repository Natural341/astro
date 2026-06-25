import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowCircleLeftIcon, SendIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing } from '../config/theme';
import {
  getConversationMessages,
  postAstrologerReply,
  ApiMessage,
} from '../services/api';

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const AstrologerChatReplyScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const { conversationId, nickname, avatar } = route.params ?? {};

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await getConversationMessages(conversationId, 200);
      setMessages(res.data ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [fetchMessages]),
  );

  // Auto-refresh every 10s to get new user messages
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    setSending(true);

    try {
      await postAstrologerReply(conversationId, text);
      // Optimistic add
      setMessages(prev => [
        ...prev,
        {
          id: `temp_${Date.now()}`,
          content: text,
          is_user: false,
          created_at: new Date().toISOString(),
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      setInputText(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const bgColor = isDark ? 'transparent' : '#F2EEF8';
  const headerBg = isDark ? '#13132A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : '#8E8E93';
  const inputBg = isDark ? '#1A1A2E' : '#F5F5F5';
  const userBubbleBg = isDark ? '#2A1A40' : '#EDE7F6';
  const astroBubbleBg = '#9D4EDD';

  const getInitial = (name: string) => (name?.charAt(0) || 'U').toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowCircleLeftIcon size={22} color={textPrimary} />
          </TouchableOpacity>
          <View style={[styles.headerAvatar, { backgroundColor: '#9D4EDD' }]}>
            <Text style={styles.headerAvatarText}>{getInitial(nickname)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: textPrimary }]}>{nickname}</Text>
            <Text style={[styles.headerSub, { color: textSecondary }]}>{t('client')}</Text>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#9D4EDD" />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              {messages.map(msg => {
                const isUser = msg.is_user; // is_user = client's message
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.bubble,
                      isUser
                        ? [styles.bubbleLeft, { backgroundColor: userBubbleBg }]
                        : [styles.bubbleRight, { backgroundColor: astroBubbleBg }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        { color: isUser ? textPrimary : '#FFFFFF' },
                      ]}
                    >
                      {msg.content}
                    </Text>
                    <Text
                      style={[
                        styles.bubbleTime,
                        { color: isUser ? textSecondary : 'rgba(255,255,255,0.6)' },
                      ]}
                    >
                      {formatTime(msg.created_at)}
                    </Text>
                  </View>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          {/* Input */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: headerBg,
                borderTopColor: borderColor,
                paddingBottom: Math.max(insets.bottom, 8),
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textPrimary },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('writeReply')}
              placeholderTextColor={textSecondary}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { opacity: inputText.trim() && !sending ? 1 : 0.4 },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <SendIcon size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 12 },

  msgList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9D4EDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
