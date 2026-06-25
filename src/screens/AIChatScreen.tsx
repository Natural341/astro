// AI Chat Screen - Voice Waveform + Modern UI
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AddCircleIcon, ClockIcon, ArrowCircleLeftIcon, CoinIcon, XIcon, ChevronRightIcon, TrashIcon, SendIcon, MicBoldIcon, MicLinearIcon, AddSquareBoldIcon, AddSquareLinearIcon, CameraIcon, ImageIcon } from '../components/icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { sanitizeInput, RateLimits } from '../utils/security';
import { chatWithAI, chatWithImage, chatWithVoice } from '../services/geminiService';
import { saveReading, getReadings, uploadMedia } from '../services/api';
import { AppConfig } from '../config/appConfig';
import { Spacing, BorderRadius, FontSizes } from '../config/theme';
import { tracker } from '../services/eventTracker';

// ─── Constants ────────────────────────────────────────────────────────────────
const WAVEFORM_BARS = 32;
const flatWave = () => Array(WAVEFORM_BARS).fill(0.15) as number[];
const formatDuration = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  image?: string;
  voiceUri?: string;
  voiceDuration?: number;
  waveform?: number[];
}

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

// ─── Static data ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { text: 'My horoscope for today', icon: 'sunny-outline' as const },
  { text: 'What does my love life look like?', icon: 'heart-outline' as const },
  { text: 'Career advice from the stars', icon: 'briefcase-outline' as const },
  { text: 'What is my rising sign?', icon: 'trending-up-outline' as const },
];

const AI_CONTEXT = `You are the AI assistant of the Kosmos Astro app. You are an expert in astrology, tarot, numerology, dream interpretation, and spiritual topics. Help the user in a sincere, knowledgeable, and supportive way. Always respond in the same language the user writes in.`;

const formatRelDate = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── RecordDot component (animated red dot) ────────────────────────────────
const RecordDot: React.FC = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E74C3C', transform: [{ scale: pulse }] }} />
  );
};

// ─── WaveformBars component (animated playback progress) ─────────────────
const WaveformBars: React.FC<{ levels: number[]; isUser: boolean; isActive: boolean; progress: number }> = ({ levels, isUser, isActive, progress }) => (
  <View style={waveStyles.waveform}>
    {levels.map((h, i) => {
      const barProgress = i / levels.length;
      const played = isActive && barProgress <= progress;
      const color = isUser
        ? (played ? '#FFF' : 'rgba(255,255,255,0.35)')
        : (played ? '#9D4EDD' : 'rgba(157,78,221,0.25)');
      return <View key={i} style={[waveStyles.waveBar, { height: Math.max(3, h * 26), backgroundColor: color }]} />;
    })}
  </View>
);

const waveStyles = StyleSheet.create({
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 28, flex: 1 },
  waveBar: { width: 2.5, borderRadius: 2 },
});

// ─── Main Component ────────────────────────────────────────────────────────
export const AIChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { user, removeTokens } = useStore();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // ── Chat state ────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  // ── Chat history from backend ─────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Recording state ───────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>(flatWave());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPositions, setPlaybackPositions] = useState<Map<string, number>>(new Map());

  // ── Refs ──────────────────────────────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const attachAnim = useRef(new Animated.Value(0)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isStartingRef = useRef(false);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const waveAccRef = useRef<number[]>(flatWave());

  // ── Theme colors ──────────────────────────────────────────────────────────
  const bgColor = colors.background;
  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF';
  const inputBg = isDark ? '#1E1E30' : '#F4F4F8';
  const panelBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB';
  const suggestionBg = isDark ? 'rgba(30,30,48,0.7)' : 'rgba(245,245,250,0.8)';
  const aiBg = isDark ? '#1E1E30' : '#FFFFFF';

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    tracker.track('screen_view', { screen: 'AIChat' });
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 10, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(attachAnim, {
      toValue: showAttach ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showAttach]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Load history from backend when panel opens
  useEffect(() => {
    if (!showHistory) return;
    setHistoryLoading(true);
    getReadings('ai_chat', 20)
      .then(res =>
        setChatHistory(
          res.data.map(r => ({
            id: r.id,
            title: r.prompt.slice(0, 45) + (r.prompt.length > 45 ? '...' : ''),
            date: formatRelDate(r.created_at),
            messages: [
              { id: r.id + '_u', text: r.prompt, isUser: true, timestamp: new Date(r.created_at) },
              { id: r.id + '_a', text: r.response, isUser: false, timestamp: new Date(r.created_at) },
            ],
          })),
        ),
      )
      .catch(() => setChatHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [showHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── Token check ────────────────────────────────────────────────────────────
  const checkTokens = (cost: number): boolean => {
    if ((user?.tokens || 0) < cost) {
      Alert.alert(
        'Insufficient Tokens',
        `You need ${cost} tokens for this action.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Tokens', onPress: () => (navigation as any).navigate('Premium') },
        ]
      );
      return false;
    }
    return true;
  };

  // ── Send text ──────────────────────────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const rawText = text || inputText.trim();
    if (!rawText || isLoading) return;
    if (!checkTokens(AppConfig.tokenCostAIChat)) return;

    if (!RateLimits.AI_CHAT.canMakeRequest()) {
      Alert.alert('Rate Limit', 'Too many messages. Please wait a moment before sending again.');
      return;
    }

    const messageText = sanitizeInput(rawText);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    tracker.track('feature_tap', { feature: 'ai_chat' });
    if (!hasStartedChat) setHasStartedChat(true);
    setShowAttach(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      removeTokens(AppConfig.tokenCostAIChat);
      const response = await chatWithAI(messageText, AI_CONTEXT);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      }]);
      tracker.track('feature_complete', { feature: 'ai_chat' });
      saveReading('ai_chat', messageText, response, AppConfig.tokenCostAIChat).catch(() => {});
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Connection lost. Please try again.',
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  // ── Image pick ─────────────────────────────────────────────────────────────
  const pickImage = async (useCamera: boolean) => {
    setShowAttach(false);
    await new Promise(r => setTimeout(r, 150));
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (!result.canceled && result.assets[0]) {
      if (!checkTokens(AppConfig.tokenCostAIChat)) return;
      if (!hasStartedChat) setHasStartedChat(true);
      const imgUri = result.assets[0].uri;
      setMessages(prev => [...prev, { id: Date.now().toString(), text: '', isUser: true, timestamp: new Date(), image: imgUri }]);
      // Upload image to backend for persistence
      uploadMedia(imgUri, 'image').catch(() => {});
      setIsLoading(true);
      try {
        removeTokens(AppConfig.tokenCostAIChat);
        const response = await chatWithImage(imgUri, '', AI_CONTEXT);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response, isUser: false, timestamp: new Date() }]);
        saveReading('ai_chat', '[Image]', response, AppConfig.tokenCostAIChat).catch(() => {});
      } catch {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Could not interpret the image.', isUser: false, timestamp: new Date() }]);
      } finally {
        setIsLoading(false);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
      }
    }
  };

  // ── Voice recording ────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (isStartingRef.current || recordingRef.current) return;
    isStartingRef.current = true;
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to send voice messages.');
        isStartingRef.current = false;
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      recordingRef.current = recording;
      waveAccRef.current = flatWave();
      setLiveWave(flatWave());
      setRecordDuration(0);
      setIsRecording(true);
      setShowAttach(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      recordTimerRef.current = setInterval(() => setRecordDuration(d => d + 1), 1000);

      recording.setOnRecordingStatusUpdate(status => {
        if (!status.isRecording) return;
        const db = status.metering ?? -60;
        const level = Math.max(0.05, Math.min(1, (db + 60) / 55));
        waveAccRef.current = [...waveAccRef.current.slice(1), level];
        setLiveWave([...waveAccRef.current]);
      });
      recording.setProgressUpdateInterval(80);
    } catch {
      Alert.alert('Error', 'Could not start recording.');
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopRecording = async (cancel: boolean) => {
    if (!recordingRef.current) return;
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    const frozenWave = [...waveAccRef.current];
    const duration = recordDuration;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setRecordDuration(0);
      setLiveWave(flatWave());

      if (!cancel && uri && duration >= 1) {
        if (!checkTokens(AppConfig.tokenCostAIChat)) return;
        if (!hasStartedChat) setHasStartedChat(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessages(prev => [...prev, {
          id: Date.now().toString(), text: '', isUser: true, timestamp: new Date(),
          voiceUri: uri, voiceDuration: duration, waveform: frozenWave,
        }]);
        // Upload voice to backend for persistence
        uploadMedia(uri, 'voice').catch(() => {});
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
        setIsLoading(true);
        try {
          removeTokens(AppConfig.tokenCostAIChat);
          const response = await chatWithVoice(uri, AI_CONTEXT);
          setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response, isUser: false, timestamp: new Date() }]);
          saveReading('ai_chat', '[Voice message]', response, AppConfig.tokenCostAIChat).catch(() => {});
        } catch {
          setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Voice message could not be processed.', isUser: false, timestamp: new Date() }]);
        } finally {
          setIsLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
        }
      } else if (cancel) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      recordingRef.current = null;
      setIsRecording(false);
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
  };

  // ── Voice playback ────────────────────────────────────────────────────────
  const togglePlay = async (uri: string, msgId: string) => {
    if (playingId === msgId) {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlayingId(null);
      setPlaybackPositions(prev => { const m = new Map(prev); m.delete(msgId); return m; });
      return;
    }
    if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); soundRef.current = null; }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlayingId(msgId);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(s => {
        if (!s.isLoaded) return;
        if (s.isPlaying) {
          setPlaybackPositions(prev => new Map(prev).set(msgId, Math.floor(s.positionMillis / 1000)));
        }
        if (s.didJustFinish) {
          setPlayingId(null);
          setPlaybackPositions(prev => { const m = new Map(prev); m.delete(msgId); return m; });
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch { setPlayingId(null); }
  };

  // ── Load history session ──────────────────────────────────────────────────
  const loadHistorySession = (item: HistoryItem) => {
    setMessages(item.messages);
    setHasStartedChat(true);
    setShowHistory(false);
  };

  const resetChat = () => { setMessages([]); setHasStartedChat(false); };

  // ── User avatar ───────────────────────────────────────────────────────────
  const UserAvatar = useCallback(() => {
    if (user?.profileImageUrl) return <Image source={{ uri: user.profileImageUrl }} style={styles.userAvatarImg} />;
    const initial = user?.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';
    return <View style={[styles.userAvatarImg, styles.avatarFallback]}><Text style={styles.avatarInitial}>{initial}</Text></View>;
  }, [user]);

  // ── Welcome screen ────────────────────────────────────────────────────────
  const renderWelcomeContent = () => (
    <View style={styles.welcomeContainer}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <Image source={require('../../assets/images/start.png')} style={styles.mascotImage} resizeMode="contain" />
      </Animated.View>
      <Text style={[styles.welcomeTitle, { color: textColor }]}>Astro AI</Text>
      {!isInputFocused && (
        <Text style={[styles.welcomeSubtitle, { color: secondaryText }]}>
          Ask anything under the guidance of the stars.{'\n'}Your cosmic advisor is here.
        </Text>
      )}
      {!isInputFocused && (
        <View style={styles.suggestionsContainer}>
          {SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.suggestionItem, { backgroundColor: suggestionBg, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
              onPress={() => handleSend(suggestion.text)}
            >
              <Ionicons name={suggestion.icon} size={20} color="#9D4EDD" />
              <Text style={[styles.suggestionText, { color: textColor }]}>{suggestion.text}</Text>
              <ChevronRightIcon size={16} color={secondaryText} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // ── Chat list ─────────────────────────────────────────────────────────────
  const renderChatList = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesContainer}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg) => {
        const isPlaying = playingId === msg.id;
        const wave = msg.waveform ?? flatWave();
        const liveSec = playbackPositions.get(msg.id);
        const playbackProgress = isPlaying && liveSec !== undefined && msg.voiceDuration
          ? liveSec / msg.voiceDuration
          : 0;
        return (
          <View key={msg.id} style={styles.msgGroup}>
            <View style={[styles.msgRow, msg.isUser && styles.msgRowUser]}>
              {!msg.isUser && (
                <View style={styles.aiAvatarWrap}>
                  <Image source={require('../../assets/images/start.png')} style={styles.aiAvatarImg} resizeMode="cover" />
                </View>
              )}
              <View style={styles.msgBody}>
                {msg.image ? (
                  <View style={[styles.imgBubble, { borderColor }]}>
                    <Image source={{ uri: msg.image }} style={styles.msgImage} />
                    <View style={styles.imgTimeOverlay}>
                      <Text style={styles.imgTimeText}>{formatTime(msg.timestamp)}</Text>
                    </View>
                  </View>
                ) : msg.voiceUri ? (
                  <TouchableOpacity
                    onPress={() => togglePlay(msg.voiceUri!, msg.id)}
                    activeOpacity={0.85}
                    style={[
                      styles.voiceBubble,
                      msg.isUser
                        ? { backgroundColor: '#9D4EDD' }
                        : { backgroundColor: aiBg, borderWidth: 1, borderColor },
                    ]}
                  >
                    <View style={styles.voiceRow}>
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={20}
                        color={msg.isUser ? '#FFF' : '#9D4EDD'}
                      />
                      <WaveformBars levels={wave} isUser={msg.isUser} isActive={isPlaying} progress={playbackProgress} />
                    </View>
                    <View style={styles.voiceBottomRow}>
                      <Text style={[styles.voiceDuration, { color: msg.isUser ? 'rgba(255,255,255,0.7)' : secondaryText }]}>
                        {isPlaying && liveSec !== undefined ? formatDuration(liveSec) : formatDuration(msg.voiceDuration ?? 0)}
                      </Text>
                      <Text style={[styles.bubbleTime, { color: msg.isUser ? 'rgba(255,255,255,0.5)' : secondaryText }]}>
                        {formatTime(msg.timestamp)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : msg.isUser ? (
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{msg.text}</Text>
                    <Text style={[styles.bubbleTime, { color: 'rgba(255,255,255,0.5)' }]}>
                      {formatTime(msg.timestamp)}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.aiBubble, { backgroundColor: aiBg, borderColor, borderWidth: 1 }]}>
                    <Text style={[styles.aiBubbleText, { color: textColor }]}>{msg.text}</Text>
                    <Text style={[styles.bubbleTime, { color: secondaryText }]}>
                      {formatTime(msg.timestamp)}
                    </Text>
                  </View>
                )}
              </View>
              {msg.isUser && <View style={{ flexShrink: 0 }}><UserAvatar /></View>}
            </View>
          </View>
        );
      })}
      {isLoading && (
        <View style={styles.msgRow}>
          <View style={styles.aiAvatarWrap}>
            <Image source={require('../../assets/images/start.png')} style={styles.aiAvatarImg} resizeMode="cover" />
          </View>
          <View style={[styles.typingBubble, { backgroundColor: aiBg, borderColor, borderWidth: 1 }]}>
            <ActivityIndicator size="small" color="#9D4EDD" />
            <Text style={[styles.typingLabel, { color: secondaryText }]}>{t('thinkingShort')}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const hasText = inputText.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { backgroundColor: inputBg }]}>
            <ArrowCircleLeftIcon size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerRightGroup}>
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: inputBg }]} onPress={resetChat}>
                <AddCircleIcon size={20} color={textColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: showHistory ? '#9D4EDD' : inputBg }]}
                onPress={() => setShowHistory(!showHistory)}
              >
                <ClockIcon size={20} color={showHistory ? '#FFF' : textColor} />
              </TouchableOpacity>
            </View>
            <View style={[styles.tokenBadge, { backgroundColor: isDark ? '#252535' : '#F8F9FA', borderColor }]}>
              <CoinIcon size={22} />
              <Text style={styles.tokenText}>{user?.tokens || 0}</Text>
            </View>
          </View>
        </View>

        {/* History panel */}
        {showHistory && (
          <View style={[styles.historyPanel, { backgroundColor: panelBg, borderColor, borderWidth: 1 }]}>
            <View style={[styles.historyHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.historyTitle, { color: textColor }]}>{t('pastConversations')}</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <XIcon size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyList}>
              {historyLoading ? (
                <ActivityIndicator color="#9D4EDD" style={{ padding: 20 }} />
              ) : chatHistory.length === 0 ? (
                <Text style={[styles.historyItemDate, { color: secondaryText, textAlign: 'center', padding: 20 }]}>{t('noPastConversations')}</Text>
              ) : (
                chatHistory.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    style={[styles.historyItem, { borderBottomColor: borderColor }]}
                    onPress={() => loadHistorySession(chat)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#9D4EDD" />
                    <View style={styles.historyItemContent}>
                      <Text style={[styles.historyItemTitle, { color: textColor }]}>{chat.title}</Text>
                      <Text style={[styles.historyItemDate, { color: secondaryText }]}>{chat.date}</Text>
                    </View>
                    <ChevronRightIcon size={16} color={secondaryText} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {!hasStartedChat ? renderWelcomeContent() : renderChatList()}

          {/* Attach panel */}
          {showAttach && !isRecording && (
            <Animated.View style={[
              styles.attachPanel,
              { backgroundColor: panelBg, borderTopColor: borderColor, opacity: attachAnim },
            ]}>
              {[
                { iconEl: <CameraIcon size={20} color="#9D4EDD" />, label: 'Camera', action: () => pickImage(true) },
                { iconEl: <ImageIcon size={20} color="#9D4EDD" />, label: 'Gallery', action: () => pickImage(false) },
              ].map(item => (
                <TouchableOpacity key={item.label} style={styles.attachItem} onPress={item.action}>
                  <View style={[styles.attachIcon, { backgroundColor: isDark ? 'rgba(157,78,221,0.15)' : 'rgba(157,78,221,0.1)' }]}>
                    {item.iconEl}
                  </View>
                  <Text style={[styles.attachLabel, { color: textColor }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Input bar */}
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.inputContainer,
              { borderTopColor: borderColor, paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
            ]}
          >
            {isRecording ? (
              /* ── Recording bar ── */
              <>
                <TouchableOpacity
                  onPress={() => stopRecording(true)}
                  style={[styles.iconBtn, { backgroundColor: 'rgba(231,76,60,0.12)' }]}
                >
                  <TrashIcon size={20} color="#E74C3C" />
                </TouchableOpacity>

                <View style={[styles.liveWaveBox, { backgroundColor: inputBg }]}>
                  <RecordDot />
                  <Text style={[styles.recordTimer, { color: textColor }]}>{formatDuration(recordDuration)}</Text>
                  <View style={styles.liveWaveInner}>
                    {liveWave.map((h, i) => (
                      <View key={i} style={[styles.liveBar, {
                        height: Math.max(3, h * 28),
                        backgroundColor: i === liveWave.length - 1
                          ? '#E74C3C'
                          : `rgba(157,78,221,${0.3 + h * 0.7})`,
                      }]} />
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => stopRecording(false)}
                  style={[styles.iconBtn, { backgroundColor: '#9D4EDD' }]}
                >
                  <SendIcon size={18} color="#FFF" />
                </TouchableOpacity>
              </>
            ) : (
              /* ── Normal bar ── */
              <>
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: showAttach ? '#9D4EDD' : inputBg }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAttach(v => !v); }}
                >
                  {showAttach ? <XIcon size={22} color="#FFF" /> : isDark ? <AddSquareBoldIcon size={22} color="#FFF" /> : <AddSquareLinearIcon size={22} color="#1C1C1E" />}
                </TouchableOpacity>

                <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={t('askAstroAI')}
                    placeholderTextColor={secondaryText}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                    onFocus={() => { setIsInputFocused(true); setShowAttach(false); }}
                    onBlur={() => setIsInputFocused(false)}
                  />
                  {hasText ? (
                    <TouchableOpacity
                      onPress={() => handleSend()}
                      disabled={isLoading}
                      style={[styles.inlineBtn, { backgroundColor: '#9D4EDD' }]}
                    >
                      <Ionicons name="arrow-up" size={18} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={startRecording}
                      style={styles.inlineBtn}
                    >
                      {isDark ? <MicBoldIcon size={20} color="#FFF" /> : <MicLinearIcon size={20} color="#1C1C1E" />}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActions: { flexDirection: 'row', gap: 8 },
  tokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
  },
  tokenText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },

  // Welcome
  keyboardView: { flex: 1 },
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  mascotImage: { width: 100, height: 100, marginBottom: 24 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  welcomeSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  suggestionsContainer: { width: '100%' },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 16, marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '500' },

  // Messages
  messagesContainer: { flex: 1 },
  messagesContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },

  msgGroup: { marginBottom: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgBody: { flexShrink: 1, maxWidth: '80%' },

  aiAvatarWrap: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(157,78,221,0.1)', flexShrink: 0 },
  aiAvatarImg: { width: 32, height: 32 },
  userAvatarImg: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: { backgroundColor: '#9D4EDD', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  userBubble: {
    backgroundColor: '#9D4EDD',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderBottomRightRadius: 4,
  },
  userBubbleText: { color: '#FFF', fontSize: 14, lineHeight: 21 },
  aiBubble: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderBottomLeftRadius: 4,
  },
  aiBubbleText: { fontSize: 14, lineHeight: 21 },

  voiceBubble: {
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 18, minWidth: 200,
  },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  voiceDuration: { fontSize: 11 },

  imgBubble: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, maxWidth: '80%' },
  msgImage: { width: 200, height: 200, resizeMode: 'cover' },
  imgTimeOverlay: {
    position: 'absolute', bottom: 6, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  imgTimeText: { color: '#FFF', fontSize: 10, fontWeight: '500' },

  typingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, gap: 8 },
  typingLabel: { fontSize: 13 },

  bubbleTime: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },

  // Attach panel
  attachPanel: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    paddingVertical: 12, borderTopWidth: 1, gap: 20,
  },
  attachItem: { alignItems: 'center', gap: 5 },
  attachIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  attachLabel: { fontSize: 11, fontWeight: '500' },

  // Input bar
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, gap: 8,
    overflow: 'hidden',
  },
  iconBtn: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingLeft: 14, paddingRight: 6, minHeight: 40 },
  input: { flex: 1, fontSize: 14, paddingVertical: 9, maxHeight: 100 },
  inlineBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },

  // Live recording bar
  liveWaveBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, height: 40, gap: 8,
  },
  recordTimer: { fontSize: 13, fontWeight: '600', minWidth: 36 },
  liveWaveInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  liveBar: { width: 2.5, borderRadius: 2 },

  // History
  historyPanel: {
    position: 'absolute', top: 60, right: Spacing.lg,
    width: 290, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 100,
  },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1,
  },
  historyTitle: { fontSize: 15, fontWeight: '600' },
  historyList: { maxHeight: 280 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, gap: 12,
  },
  historyItemContent: { flex: 1 },
  historyItemTitle: { fontSize: 14, fontWeight: '500' },
  historyItemDate: { fontSize: 12, marginTop: 2 },
});
