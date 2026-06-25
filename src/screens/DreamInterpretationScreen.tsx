// Dream Interpretation Screen - Voice Waveform + Modern UI
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
import { Ionicons } from '@expo/vector-icons';
import { ClockIcon, ArrowCircleLeftIcon, MoonIcon, ChevronRightIcon, TrashIcon, SendIcon, MicBoldIcon, MicLinearIcon, AddSquareBoldIcon, AddSquareLinearIcon, XIcon, CameraIcon, ImageIcon } from '../components/icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { chatWithAI, chatWithVoice } from '../services/geminiService';
import { saveReading, getReadings } from '../services/api';
import { AppConfig } from '../config/appConfig';
import { Spacing } from '../config/theme';
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

interface Session {
  id: string;
  preview: string;
  date: string;
  messages: Message[];
}

// ─── Static data ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "I was flying in my dream — what does it mean?",
  "My teeth were falling out.",
  "I was being chased but couldn't run.",
  "I saw someone who has passed away.",
  "I was late for an exam and couldn't find the room.",
  "I was falling from a very high place.",
];

const formatRelDate = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── RecordDot component ──────────────────────────────────────────────────────
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

// ─── WaveformBars component ────────────────────────────────────────────────────
const WaveformBars: React.FC<{ levels: number[]; isUser: boolean; isActive: boolean }> = ({ levels, isUser, isActive }) => (
  <View style={waveStyles.waveform}>
    {levels.map((h, i) => {
      const played = isActive && i < levels.length / 2;
      const color = isUser
        ? (played ? '#FFF' : 'rgba(255,255,255,0.45)')
        : (played ? '#9D4EDD' : 'rgba(157,78,221,0.35)');
      return <View key={i} style={[waveStyles.waveBar, { height: Math.max(3, h * 26), backgroundColor: color }]} />;
    })}
  </View>
);

const waveStyles = StyleSheet.create({
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 28, flex: 1 },
  waveBar: { width: 2.5, borderRadius: 2 },
});

// ─── Main Component ────────────────────────────────────────────────────────────
export const DreamInterpretationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, removeTokens } = useStore();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const SUGGESTIONS_T = [
    t('dreamSuggestion1'), t('dreamSuggestion2'), t('dreamSuggestion3'),
    t('dreamSuggestion4'), t('dreamSuggestion5'), t('dreamSuggestion6'),
  ];
  const insets = useSafeAreaInsets();

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── Past sessions from backend ──────────────────────────────────────────────
  const [pastSessions, setPastSessions] = useState<Session[]>([]);

  // ── Recording state ─────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>(flatWave());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPositions, setPlaybackPositions] = useState<Map<string, number>>(new Map());

  // ── Refs ────────────────────────────────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const attachAnim = useRef(new Animated.Value(0)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isStartingRef = useRef(false);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const waveAccRef = useRef<number[]>(flatWave());

  // ── Theme colors ────────────────────────────────────────────────────────────
  const bgColor = colors.background;
  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const inputBg = isDark ? '#1E1E30' : '#F4F4F8';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB';
  const aiBg = isDark ? '#1E1E30' : '#FFFFFF';

  // ── Dream context ───────────────────────────────────────────────────────────
  const DREAM_CONTEXT = `You are a mystical Dream Interpreter. Interpret the dream using symbols, archetypes, and traditional analysis. Warm, mystical tone. 2-4 sentences per response.
${user?.zodiacSign ? `Zodiac: ${user.zodiacSign}.` : ''}
${user?.birthDate ? `Birth date: ${user.birthDate}.` : ''}`;

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  useEffect(() => {
    tracker.track('screen_view', { screen: 'DreamInterpretation' });
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 8, duration: 1800, useNativeDriver: true }),
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
    if (messages.length > 0) setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Load past sessions from backend when history panel opens
  useEffect(() => {
    if (!showHistory) return;
    getReadings('dream', 10)
      .then(res =>
        setPastSessions(
          res.data.map(r => ({
            id: r.id,
            preview: r.prompt.slice(0, 60),
            date: formatRelDate(r.created_at),
            messages: [
              { id: r.id + '_u', text: r.prompt, isUser: true, timestamp: new Date(r.created_at) },
              { id: r.id + '_a', text: r.response, isUser: false, timestamp: new Date(r.created_at) },
            ],
          })),
        ),
      )
      .catch(() => setPastSessions([]));
  }, [showHistory]);

  // ── Send text ───────────────────────────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    if ((user?.tokens || 0) < AppConfig.tokenCostDreamInterpretation) {
      Alert.alert('Insufficient Tokens', 'You need more tokens for this reading.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Get Tokens', onPress: () => (navigation as any).navigate('Premium') }]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    tracker.track('feature_tap', { feature: 'dream_interpretation' });
    if (!hasStartedChat) setHasStartedChat(true);
    setShowAttach(false);

    const userMsg: Message = { id: Date.now().toString(), text: messageText, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      removeTokens(AppConfig.tokenCostDreamInterpretation);
      const response = await chatWithAI(messageText, DREAM_CONTEXT);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response, isUser: false, timestamp: new Date() }]);
      tracker.track('feature_complete', { feature: 'dream_interpretation' });
      saveReading('dream', messageText, response, AppConfig.tokenCostDreamInterpretation).catch(() => {});
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Connection to the dream realm lost. Try again.', isUser: false, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  // ── Image pick ──────────────────────────────────────────────────────────────
  const pickImage = async (useCamera: boolean) => {
    setShowAttach(false);
    await new Promise(r => setTimeout(r, 150));
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (!result.canceled && result.assets[0]) {
      if (!hasStartedChat) setHasStartedChat(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: '', isUser: true, timestamp: new Date(), image: result!.assets[0].uri }]);
    }
  };

  // ── Voice recording ─────────────────────────────────────────────────────────
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
        if ((user?.tokens || 0) < AppConfig.tokenCostDreamInterpretation) {
          Alert.alert('Insufficient Tokens', 'You need more tokens for this reading.');
          return;
        }
        if (!hasStartedChat) setHasStartedChat(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessages(prev => [...prev, {
          id: Date.now().toString(), text: '', isUser: true, timestamp: new Date(),
          voiceUri: uri, voiceDuration: duration, waveform: frozenWave,
        }]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
        setIsLoading(true);
        try {
          removeTokens(AppConfig.tokenCostDreamInterpretation);
          const response = await chatWithVoice(uri, DREAM_CONTEXT);
          setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response, isUser: false, timestamp: new Date() }]);
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

  // ── Voice playback ──────────────────────────────────────────────────────────
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

  // ── User avatar ─────────────────────────────────────────────────────────────
  const UserAvatar = useCallback(() => {
    if (user?.profileImageUrl) return <Image source={{ uri: user.profileImageUrl }} style={styles.userAvatarImg} />;
    const initial = user?.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';
    return <View style={[styles.userAvatarImg, styles.avatarFallback]}><Text style={styles.avatarInitial}>{initial}</Text></View>;
  }, [user]);

  // ── Welcome screen ──────────────────────────────────────────────────────────
  const renderWelcome = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.welcomeScroll} keyboardShouldPersistTaps="handled">
      <Animated.View style={{ transform: [{ translateY: floatAnim }], alignItems: 'center' }}>
        <View style={[styles.mascotWrap, { backgroundColor: cardBg }]}>
          <Image source={require('../../assets/images/baslangic1.png')} style={styles.mascotImg} resizeMode="cover" />
        </View>
      </Animated.View>
      <Text style={[styles.welcomeTitle, { color: textColor }]}>{t('dreamInterpreter')}</Text>
      <Text style={[styles.welcomeSub, { color: secondaryText }]}>Share your dream and uncover hidden messages from your subconscious.</Text>

      <Text style={[styles.suggestLabel, { color: secondaryText }]}>{t('popularDreams')}</Text>
      {SUGGESTIONS_T.map((s, i) => (
        <TouchableOpacity key={i} style={[styles.suggestItem, { backgroundColor: cardBg, borderColor }]} onPress={() => handleSend(s)} activeOpacity={0.75}>
          <MoonIcon size={14} color="#9D4EDD" />
          <Text style={[styles.suggestText, { color: textColor }]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ── Chat list ───────────────────────────────────────────────────────────────
  const renderChat = () => (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1 }}
      contentContainerStyle={styles.chatContent}
      showsVerticalScrollIndicator={false}
    >
      {messages.map(msg => {
        const isPlaying = playingId === msg.id;
        const wave = msg.waveform ?? flatWave();
        const liveSec = playbackPositions.get(msg.id);
        return (
          <View key={msg.id} style={styles.msgGroup}>
            <View style={[styles.msgRow, msg.isUser && styles.msgRowUser]}>
              {!msg.isUser && (
                <View style={[styles.aiAvatarWrap, { borderColor }]}>
                  <Image source={require('../../assets/images/start1.png')} style={styles.aiAvatarImg} resizeMode="cover" />
                </View>
              )}
              <View style={styles.msgBody}>
                {msg.image ? (
                  <View style={[styles.imgBubble, { borderColor }]}>
                    <Image source={{ uri: msg.image }} style={styles.msgImage} />
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
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={msg.isUser ? '#FFF' : '#9D4EDD'} />
                      <WaveformBars levels={wave} isUser={msg.isUser} isActive={isPlaying} />
                    </View>
                    <Text style={[styles.voiceDuration, { color: msg.isUser ? 'rgba(255,255,255,0.7)' : secondaryText }]}>
                      {isPlaying && liveSec !== undefined ? formatDuration(liveSec) : formatDuration(msg.voiceDuration ?? 0)}
                    </Text>
                  </TouchableOpacity>
                ) : msg.isUser ? (
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{msg.text}</Text>
                  </View>
                ) : (
                  <View style={[styles.aiBubble, { backgroundColor: aiBg, borderColor, borderWidth: 1 }]}>
                    <Text style={[styles.aiBubbleText, { color: textColor }]}>{msg.text}</Text>
                  </View>
                )}
              </View>
              {msg.isUser && <View style={{ flexShrink: 0 }}><UserAvatar /></View>}
            </View>
            <Text style={[styles.msgTime, { color: secondaryText }, msg.isUser ? styles.msgTimeRight : styles.msgTimeLeft]}>
              {formatTime(msg.timestamp)}
            </Text>
          </View>
        );
      })}
      {isLoading && (
        <View style={styles.msgRow}>
          <View style={[styles.aiAvatarWrap, { borderColor }]}>
            <Image source={require('../../assets/images/start1.png')} style={styles.aiAvatarImg} resizeMode="cover" />
          </View>
          <View style={[styles.typingBubble, { backgroundColor: aiBg, borderColor, borderWidth: 1 }]}>
            <ActivityIndicator size="small" color="#9D4EDD" />
            <Text style={[styles.typingLabel, { color: secondaryText }]}>{t('interpreting')}</Text>
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}
          >
            <ArrowCircleLeftIcon size={22} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: textColor }]}>{t('dreamInterpreter')}</Text>
            <View style={styles.onlineDot} />
          </View>
          <TouchableOpacity
            onPress={() => setShowHistory(v => !v)}
            style={[styles.headerBtn, { backgroundColor: showHistory ? '#9D4EDD' : (isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0') }]}
          >
            <ClockIcon size={20} color={showHistory ? '#FFF' : textColor} />
          </TouchableOpacity>
        </View>

        {/* History panel */}
        {showHistory && (
          <View style={[styles.historyPanel, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
            <Text style={[styles.historyTitle, { color: textColor }]}>{t('pastDreams')}</Text>
            {pastSessions.length === 0 ? (
              <Text style={[styles.historyDate, { color: secondaryText, textAlign: 'center', paddingVertical: 12 }]}>{t('noPastDreams')}</Text>
            ) : (
              pastSessions.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.historyItem, { borderBottomColor: borderColor }]}
                  onPress={() => { setMessages(s.messages); setHasStartedChat(true); setShowHistory(false); }}
                >
                  <MoonIcon size={16} color="#9D4EDD" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyPreview, { color: textColor }]} numberOfLines={1}>{s.preview}</Text>
                    <Text style={[styles.historyDate, { color: secondaryText }]}>{s.date}</Text>
                  </View>
                  <ChevronRightIcon size={14} color={secondaryText} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {!hasStartedChat ? renderWelcome() : renderChat()}

          {/* Attach panel */}
          {showAttach && !isRecording && (
            <Animated.View style={[styles.attachPanel, { backgroundColor: cardBg, borderTopColor: borderColor, opacity: attachAnim }]}>
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
            style={[styles.inputBar, { borderTopColor: borderColor, paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}
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
                  style={[styles.plusBtn, { backgroundColor: showAttach ? '#9D4EDD' : (isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0') }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAttach(v => !v); }}
                >
                  {showAttach ? <XIcon size={22} color="#FFF" /> : isDark ? <AddSquareBoldIcon size={22} color="#FFF" /> : <AddSquareLinearIcon size={22} color="#1C1C1E" />}
                </TouchableOpacity>

                <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                  <TextInput
                    style={[styles.inputText, { color: textColor }]}
                    placeholder={t('tellYourDream')}
                    placeholderTextColor={secondaryText}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={1000}
                    onFocus={() => setShowAttach(false)}
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
    paddingHorizontal: Spacing.lg, paddingVertical: 11, borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9D4EDD' },

  // History
  historyPanel: {
    borderRadius: 16, margin: Spacing.md, padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  historyTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  historyPreview: { fontSize: 13, fontWeight: '500' },
  historyDate: { fontSize: 11, marginTop: 2 },

  // Welcome
  welcomeScroll: { alignItems: 'center', padding: Spacing.lg, paddingTop: 24 },
  mascotWrap: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: 18, shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18, elevation: 8 },
  mascotImg: { width: 100, height: 100 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  welcomeSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  suggestLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, alignSelf: 'flex-start', marginBottom: 10 },
  suggestItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 13, borderWidth: 1, width: '100%', marginBottom: 8 },
  suggestText: { fontSize: 14, flex: 1 },

  // Chat
  chatContent: { padding: Spacing.lg, paddingBottom: 16 },
  msgGroup: { marginBottom: 20 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgBody: { flex: 1 },

  aiAvatarWrap: { width: 30, height: 30, borderRadius: 15, overflow: 'hidden', borderWidth: 1, flexShrink: 0 },
  aiAvatarImg: { width: 30, height: 30 },
  userAvatarImg: { width: 30, height: 30, borderRadius: 15 },
  avatarFallback: { backgroundColor: '#9D4EDD', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  userBubble: {
    maxWidth: '82%', alignSelf: 'flex-end',
    backgroundColor: '#9D4EDD',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderBottomRightRadius: 4,
  },
  userBubbleText: { color: '#FFF', fontSize: 14, lineHeight: 21 },
  aiBubble: {
    maxWidth: '82%', alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderBottomLeftRadius: 4,
  },
  aiBubbleText: { fontSize: 14, lineHeight: 21 },

  voiceBubble: {
    maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 18, alignSelf: 'flex-start',
  },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceDuration: { fontSize: 11, marginTop: 4 },

  imgBubble: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, maxWidth: '80%' },
  msgImage: { width: 200, height: 200, resizeMode: 'cover' },

  typingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, gap: 8 },
  typingLabel: { fontSize: 13 },

  msgTime: { fontSize: 11, marginTop: 4 },
  msgTimeLeft: { marginLeft: 38 },
  msgTimeRight: { textAlign: 'right', marginRight: 38 },

  // Attach
  attachPanel: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: 12, borderTopWidth: 1, gap: 20 },
  attachItem: { alignItems: 'center', gap: 5 },
  attachIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  attachLabel: { fontSize: 11, fontWeight: '500' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, gap: 8,
    overflow: 'hidden',
  },
  plusBtn: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingLeft: 13, paddingRight: 6, borderWidth: 1, minHeight: 40 },
  inputText: { flex: 1, fontSize: 14, paddingVertical: 9, maxHeight: 100 },
  inlineBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },

  // Live recording bar
  liveWaveBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, height: 40, gap: 8,
  },
  recordTimer: { fontSize: 13, fontWeight: '600', minWidth: 36 },
  liveWaveInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  liveBar: { width: 2.5, borderRadius: 2 },
});
