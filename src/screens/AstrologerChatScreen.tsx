import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Image,
  Animated,
  Alert,
  Modal,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ClockIcon, ArrowCircleLeftIcon, XIcon, TrashIcon, SendIcon, MicBoldIcon, MicLinearIcon, AddSquareBoldIcon, AddSquareLinearIcon, ShareIcon, CameraIcon, ImageIcon } from '../components/icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { sanitizeInput } from '../utils/security';
import { chatWithAI, chatWithImage, chatWithVoice } from '../services/geminiService';
import {
  getOrCreateConversation,
  getConversationMessages,
  postMessage as postBackendMessage,
  uploadMedia,
} from '../services/api';
import { Spacing } from '../config/theme';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  image?: string;
  imageCaption?: string;
  voiceUri?: string;
  voiceDuration?: number;
  waveform?: number[];
}

const WAVEFORM_BARS = 32;

const INITIAL_MESSAGES = (name: string): Message[] => [
  { id: '1', text: `Hello! I'm ${name}. I've been looking forward to our session.`, isUser: false, timestamp: new Date(Date.now() - 7200000) },
  { id: '2', text: 'The cosmic energies are particularly active right now — your chart is in an interesting phase. What would you like to explore today?', isUser: false, timestamp: new Date(Date.now() - 7140000) },
  { id: '3', text: 'I can help with birth chart readings, relationship compatibility, career timing, or a general cosmic forecast. What calls to you?', isUser: false, timestamp: new Date(Date.now() - 7080000) },
];

const formatDuration = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

const flatWave = () => Array(WAVEFORM_BARS).fill(0.15) as number[];

// ─── Report reasons ─────────────────────────────────────────────────────────
const REPORT_REASONS = [
  'Inappropriate content',
  'Harassment or abuse',
  'Fraud or scam',
  'Inaccurate / misleading information',
  'Spam',
  'Other',
];

// ─── Component ───────────────────────────────────────────────────────────────
export const AstrologerChatScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, removeTokens } = useStore();
  const insets = useSafeAreaInsets();

  const astrologer = route.params?.astrologer ?? {
    name: 'Elara Moonstone', title: 'Vedic Astrologer',
    avatar: require('../../assets/images/real_elara.jpg'), primaryColor: '#9D4EDD',
  };

  // is_ai defaults to true for backward compat (all existing astrologers are AI)
  const isAiAstrologer = astrologer.is_ai !== false;

  // ─── UI state ─────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  // ─── Report modal state ───────────────────────────────────────────────
  const [showReport, setShowReport] = useState(false);
  const [reportStep, setReportStep] = useState<1 | 2>(1);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');

  // ─── Recording state ──────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>(flatWave());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPositions, setPlaybackPositions] = useState<Map<string, number>>(new Map());
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');

  // ─── Refs ─────────────────────────────────────────────────────────────
  const scrollRef = useRef<ScrollView>(null);
  const attachAnim = useRef(new Animated.Value(0)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isStartingRef = useRef(false); // guard double-start
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const waveAccRef = useRef<number[]>(flatWave()); // accumulate levels during recording

  // ─── Message queue (async send) ───────────────────────────────────────
  type QueueItem =
    | { kind: 'text'; text: string }
    | { kind: 'voice'; uri: string; duration: number; waveform: number[] }
    | { kind: 'image'; uri: string; caption: string };
  const messageQueue = useRef<QueueItem[]>([]);
  const isProcessingRef2 = useRef(false); // separate from isStartingRef

  // ─── Colours ──────────────────────────────────────────────────────────
  const headerBg = isDark ? 'rgba(15,12,36,0.85)' : 'rgba(255,255,255,0.92)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB';
  const textColor = colors.text;
  const secondaryText = isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF';
  const inputBg = isDark ? '#1E1E30' : '#F4F4F8';
  const aiBg = isDark ? '#1E1E30' : '#FFFFFF';

  // Use persona-specific system prompt from astrologer data, with user context appended
  const basePersonaPrompt = astrologer.systemPrompt
    ?? `You are ${astrologer.name}, a professional astrologer with 20 years of experience. Title: ${astrologer.title}. Speak with warmth, depth, and mystical insight. Keep responses 2-4 sentences.`;
  const systemPrompt = `${basePersonaPrompt}
${user?.zodiacSign ? `Client's zodiac sign: ${user.zodiacSign}.` : ''}
${user?.birthDate ? `Client's birth date: ${user.birthDate}.` : ''}`;

  const chatKey = `astrologer_chat_${astrologer.name.replace(/\s+/g, '_')}`;
  const chatLoadedRef = useRef(false); // guard: don't save before load completes

  // ─── Lifecycle ────────────────────────────────────────────────────────
  // Load persisted messages on mount — backend first, AsyncStorage fallback
  useEffect(() => {
    const loadFromAsyncStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem(chatKey);
        if (stored) {
          const parsed: Message[] = JSON.parse(stored);
          if (parsed.length > 0) {
            setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
            chatLoadedRef.current = true;
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
            return;
          }
        }
      } catch {}
      // No cached messages either — show welcome messages
      setMessages(INITIAL_MESSAGES(astrologer.name));
      chatLoadedRef.current = true;
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    };

    const load = async () => {
      try {
        const conv = await getOrCreateConversation(astrologer.name);
        setConvId(conv.id);
        const msgRes = await getConversationMessages(conv.id);
        if (msgRes.data.length > 0) {
          setMessages(
            msgRes.data.map(m => ({
              id: m.id,
              text: m.content,
              isUser: m.is_user,
              timestamp: new Date(m.created_at),
            })),
          );
          chatLoadedRef.current = true;
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
          return;
        }
        // Backend returned no messages → fall through to AsyncStorage
        await loadFromAsyncStorage();
      } catch {
        // Backend unreachable → AsyncStorage fallback
        await loadFromAsyncStorage();
      }
    };
    load();
  }, []);

  // Persist messages whenever they change (keep last 100)
  useEffect(() => {
    if (!chatLoadedRef.current) return; // wait until initial load is done
    const save = async () => {
      try {
        await AsyncStorage.setItem(chatKey, JSON.stringify(messages.slice(-100)));
      } catch {}
    };
    save();
  }, [messages]);

  useEffect(() => {
    Animated.timing(attachAnim, {
      toValue: showAttach ? 1 : 0, duration: 200, useNativeDriver: true,
    }).start();
  }, [showAttach]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ─── Token check helper ───────────────────────────────────────────────
  const checkAndDeductTokens = (cost: number): boolean => {
    const ok = removeTokens(cost);
    if (!ok) {
      Alert.alert(
        'Insufficient Tokens',
        `You need at least ${cost} Moon Tokens to send a message.`,
        [
          { text: 'Get Tokens', onPress: () => navigation.navigate('Premium') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
    return ok;
  };

  // ─── Queue processor ──────────────────────────────────────────────────
  const processQueue = useCallback(async () => {
    if (isProcessingRef2.current) return;
    isProcessingRef2.current = true;

    while (messageQueue.current.length > 0) {
      const item = messageQueue.current.shift()!;
      setIsLoading(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

      let aiText = '';
      try {
        if (item.kind === 'text') {
          aiText = await chatWithAI(item.text, systemPrompt);
        } else if (item.kind === 'voice') {
          aiText = await chatWithVoice(item.uri, systemPrompt);
        } else if (item.kind === 'image') {
          aiText = await chatWithImage(item.uri, item.caption, systemPrompt);
        }
        const aiMsg: Message = { id: String(Date.now()), text: aiText, isUser: false, timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
        if (convId) postBackendMessage(convId, aiText, false).catch(() => {});
      } catch {
        setMessages(prev => [...prev, {
          id: String(Date.now()),
          text: 'The cosmic connection was interrupted. Please try again.',
          isUser: false, timestamp: new Date(),
        }]);
      } finally {
        setIsLoading(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      }
    }

    isProcessingRef2.current = false;
  }, [convId, systemPrompt]);

  // ─── Text send ────────────────────────────────────────────────────────
  const sendMessage = async (textOverride?: string) => {
    const rawText = textOverride ?? inputText.trim();
    if (!rawText) return;
    if (!checkAndDeductTokens(10)) return;
    const text = sanitizeInput(rawText);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => [...prev, { id: String(Date.now()), text, isUser: true, timestamp: new Date() }]);
    setInputText('');
    if (convId) postBackendMessage(convId, text, true).catch(() => {});

    if (isAiAstrologer) {
      messageQueue.current.push({ kind: 'text', text });
      processQueue();
    }
    // Real astrologer: message is sent to backend, no AI response.
    // User sees "Waiting for reply..." indicator handled below.
  };

  // ─── Recording: tap-to-start / tap-to-send ─────────────────────────────
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording(false);
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    if (isStartingRef.current || recordingRef.current) return; // guard
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Timer
      recordTimerRef.current = setInterval(() => {
        setRecordDuration(d => d + 1);
      }, 1000);

      // Live metering → animated waveform (WhatsApp scrolling bars)
      recording.setOnRecordingStatusUpdate(status => {
        if (!status.isRecording) return;
        const db = status.metering ?? -60;
        // Normalise: -60dB = silence, 0dB = max. We map to 0.05–1.
        const level = Math.max(0.05, Math.min(1, (db + 60) / 55));
        waveAccRef.current = [...waveAccRef.current.slice(1), level];
        setLiveWave([...waveAccRef.current]);
      });
      recording.setProgressUpdateInterval(80); // ~12 fps
    } catch (err) {
      console.error('[Voice] Failed to start recording:', err);
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
        if (!checkAndDeductTokens(10)) return;
        setMessages(prev => [...prev, {
          id: String(Date.now()), text: '', isUser: true, timestamp: new Date(),
          voiceUri: uri, voiceDuration: duration, waveform: frozenWave,
        }]);
        // Upload voice to backend and store with media URL
        if (convId) {
          uploadMedia(uri, 'voice')
            .then(res => postBackendMessage(convId, `[Voice message: ${duration}s]`, true, res.url, 'voice'))
            .catch(() => postBackendMessage(convId, `[Voice message: ${duration}s]`, true).catch(() => {}));
        }
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (isAiAstrologer) {
          messageQueue.current.push({ kind: 'voice', uri, duration, waveform: frozenWave });
          processQueue();
        }
      } else if (cancel) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (err) {
      console.error('[Voice] stopRecording error:', err);
      recordingRef.current = null;
      setIsRecording(false);
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
  };

  // ─── Voice playback ───────────────────────────────────────────────────
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
    } catch (err) { console.error('[Voice] Playback error:', err); setPlayingId(null); }
  };

  // ─── Image picker ─────────────────────────────────────────────────────
  const pickImage = async (useCamera: boolean) => {
    setShowAttach(false);
    // Let attach panel close before opening picker
    await new Promise(r => setTimeout(r, 150));

    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    };

    try {
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Camera access is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(opts);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Photo library access is needed to choose images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(opts);
      }
      if (!result.canceled && result.assets?.[0]) {
        setPendingImage(result.assets[0].uri);
        setPendingCaption('');
      }
    } catch (err) {
      console.error('[ImagePicker] Error:', err);
    }
  };

  // addAIResponse artık kullanılmıyor — processQueue ile değiştirildi

  // ─── Send image + caption, trigger vision AI ──────────────────────────
  const sendImageWithCaption = () => {
    if (!pendingImage) return;
    if (!checkAndDeductTokens(10)) return;
    const caption = pendingCaption.trim();
    const imageUri = pendingImage;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => [...prev, {
      id: String(Date.now()), text: caption, isUser: true,
      timestamp: new Date(), image: imageUri, imageCaption: caption,
    }]);
    setPendingImage(null);
    setPendingCaption('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    // Upload image to backend and store with media URL
    if (convId) {
      uploadMedia(imageUri, 'image')
        .then(res => postBackendMessage(convId, caption || '[Image]', true, res.url, 'image'))
        .catch(() => postBackendMessage(convId, caption || '[Image]', true).catch(() => {}));
    }
    if (isAiAstrologer) {
      messageQueue.current.push({ kind: 'image', uri: imageUri, caption });
      processQueue();
    }
  };

  // ─── Image actions ────────────────────────────────────────────────────
  const shareFullscreenImage = async () => {
    if (!fullscreenImage) return;
    try {
      await Share.share(
        Platform.OS === 'ios' ? { url: fullscreenImage } : { message: fullscreenImage }
      );
    } catch {}
  };

  // ─── Report helpers ───────────────────────────────────────────────────
  const openReport = () => {
    setShowMenu(false);
    setReportStep(1);
    setReportReason('');
    setReportDetail('');
    setShowReport(true);
  };

  const submitReport = () => {
    setShowReport(false);
    setTimeout(() => Alert.alert('Report Submitted', 'Thank you. Our team will review this within 24 hours.'), 300);
  };

  // ─── Avatars ──────────────────────────────────────────────────────────
  const UserAvatar = useCallback(() => {
    if (user?.profileImageUrl) return <Image source={{ uri: user.profileImageUrl }} style={styles.smallAvatar} />;
    const initial = user?.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';
    return (
      <View style={[styles.smallAvatar, styles.avatarFallback]}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
    );
  }, [user]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // ─── Waveform bar renderer (animated playback progress) ─────────────────
  const WaveformBars = ({ levels, isUser, isActive, progress }: { levels: number[]; isUser: boolean; isActive: boolean; progress: number }) => (
    <View style={styles.waveform}>
      {levels.map((h, i) => {
        const barProgress = i / levels.length;
        const played = isActive && barProgress <= progress;
        const color = isUser
          ? (played ? '#FFF' : 'rgba(255,255,255,0.35)')
          : (played ? astrologer.primaryColor : 'rgba(157,78,221,0.25)');
        return <View key={i} style={[styles.waveBar, { height: Math.max(3, h * 26), backgroundColor: color }]} />;
      })}
    </View>
  );

  // ─── Message renderer ─────────────────────────────────────────────────
  const renderMessage = (msg: Message) => {
    const isPlaying = playingId === msg.id;
    const wave = msg.waveform ?? flatWave();
    const liveSec = playbackPositions.get(msg.id);
    const playbackProgress = isPlaying && liveSec !== undefined && msg.voiceDuration
      ? liveSec / msg.voiceDuration
      : 0;
    return (
      <View key={msg.id} style={styles.msgGroup}>
        <View style={[styles.msgRow, msg.isUser && styles.msgRowUser]}>
          {!msg.isUser && <Image source={astrologer.avatar} style={styles.smallAvatar} />}
          <View style={styles.msgBody}>
            {msg.image ? (
              <View>
                <TouchableOpacity
                  onPress={() => setFullscreenImage(msg.image!)}
                  activeOpacity={0.92}
                  style={[styles.imgBubble, { borderColor }]}
                >
                  <Image source={{ uri: msg.image }} style={styles.msgImage} />
                  <View style={styles.imgTimeOverlay}>
                    <Text style={styles.imgTimeText}>{formatTime(msg.timestamp)}{msg.isUser ? '  ✓✓' : ''}</Text>
                  </View>
                </TouchableOpacity>
                {!!msg.imageCaption && (
                  <View style={[styles.captionBubble, msg.isUser
                    ? { backgroundColor: astrologer.primaryColor, borderBottomRightRadius: 4 }
                    : { backgroundColor: aiBg, borderWidth: 1, borderColor, borderBottomLeftRadius: 4 }
                  ]}>
                    <Text selectable style={[styles.bubbleText, { color: msg.isUser ? '#FFF' : textColor }]}>
                      {msg.imageCaption}
                    </Text>
                    <Text style={[styles.bubbleTime, { color: msg.isUser ? 'rgba(255,255,255,0.5)' : secondaryText }]}>
                      {formatTime(msg.timestamp)}{msg.isUser ? '  ✓✓' : ''}
                    </Text>
                  </View>
                )}
              </View>
            ) : msg.voiceUri ? (
              <TouchableOpacity
                onPress={() => togglePlay(msg.voiceUri!, msg.id)}
                activeOpacity={0.85}
                style={[
                  styles.voiceBubble,
                  msg.isUser
                    ? { backgroundColor: astrologer.primaryColor }
                    : { backgroundColor: aiBg, borderWidth: 1, borderColor },
                ]}
              >
                <View style={styles.voiceRow}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={msg.isUser ? '#FFF' : astrologer.primaryColor} />
                  <WaveformBars levels={wave} isUser={msg.isUser} isActive={isPlaying} progress={playbackProgress} />
                </View>
                <View style={styles.voiceBottomRow}>
                  <Text style={[styles.voiceDuration, { color: msg.isUser ? 'rgba(255,255,255,0.7)' : secondaryText }]}>
                    {isPlaying && liveSec !== undefined
                      ? formatDuration(liveSec)
                      : formatDuration(msg.voiceDuration ?? 0)}
                  </Text>
                  <Text style={[styles.bubbleTime, { color: msg.isUser ? 'rgba(255,255,255,0.5)' : secondaryText }]}>
                    {formatTime(msg.timestamp)}{msg.isUser ? '  ✓✓' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[
                styles.bubble,
                msg.isUser
                  ? { backgroundColor: astrologer.primaryColor, borderBottomRightRadius: 4 }
                  : { backgroundColor: aiBg, borderWidth: 1, borderColor, borderBottomLeftRadius: 4 },
              ]}>
                <Text selectable style={[styles.bubbleText, { color: msg.isUser ? '#FFF' : textColor }]}>{msg.text}</Text>
                <Text style={[styles.bubbleTime, { color: msg.isUser ? 'rgba(255,255,255,0.5)' : secondaryText }]}>
                  {formatTime(msg.timestamp)}{msg.isUser ? '  ✓✓' : ''}
                </Text>
              </View>
            )}
          </View>
          {msg.isUser && (
            <View style={{ flexShrink: 0 }}>
              <UserAvatar />
            </View>
          )}
        </View>
      </View>
    );
  };

  const hasText = inputText.trim().length > 0;

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}>
            <ArrowCircleLeftIcon size={22} color={textColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerProfile}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AstrologerProfile', { astrologer })}
          >
            <View style={styles.avatarWrap}>
              <Image source={astrologer.avatar} style={styles.headerAvatar} />
              <View style={[styles.onlineDot, { borderColor: headerBg }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerName, { color: textColor }]}>{astrologer.name}</Text>
              <Text style={[styles.headerSub, { color: '#4ADE80' }]}>
                {isMuted ? 'Muted' : 'Online'} · {astrologer.title}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowMenu(true)}
            style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}>
            <Ionicons name="ellipsis-vertical" size={18} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Messages list */}
        <View style={{ flex: 1 }}>
          <ScrollView ref={scrollRef} style={styles.msgList}
            contentContainerStyle={styles.msgListContent} showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
              const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
              setShowScrollBtn(distFromBottom > 120);
            }}
            scrollEventThrottle={100}
          >
            {messages.map(renderMessage)}
            {isLoading && isAiAstrologer && (
              <View style={styles.msgRow}>
                <Image source={astrologer.avatar} style={styles.smallAvatar} />
                <View style={[styles.typingBubble, { backgroundColor: aiBg, borderColor, borderWidth: 1 }]}>
                  <ActivityIndicator size="small" color={astrologer.primaryColor} />
                  <Text style={[styles.typingLabel, { color: secondaryText }]}>typing...</Text>
                </View>
              </View>
            )}
            {!isAiAstrologer && messages.length > 0 && messages[messages.length - 1].isUser && (
              <View style={[styles.waitingBanner, { backgroundColor: aiBg, borderColor }]}>
                <ClockIcon size={14} color={secondaryText} />
                <Text style={[styles.waitingText, { color: secondaryText }]}>
                  Message sent. Waiting for {astrologer.name}'s reply...
                </Text>
              </View>
            )}
          </ScrollView>
          {showScrollBtn && (
            <TouchableOpacity
              style={[styles.scrollToBottomBtn, { backgroundColor: astrologer.primaryColor }]}
              onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-down" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Attach panel */}
        <Animated.View style={[
          styles.attachPanel,
          { backgroundColor: headerBg, borderTopColor: borderColor },
          { opacity: attachAnim, transform: [{ translateY: attachAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }], display: showAttach ? 'flex' : 'none' },
        ]}>
          {[
            { iconEl: <CameraIcon size={20} color="#9D4EDD" />, label: 'Camera', cb: () => pickImage(true) },
            { iconEl: <ImageIcon size={20} color="#9D4EDD" />, label: 'Gallery', cb: () => pickImage(false) },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.attachItem} onPress={item.cb}>
              <View style={[styles.attachIcon, { backgroundColor: isDark ? 'rgba(157,78,221,0.15)' : 'rgba(157,78,221,0.08)' }]}>
                {item.iconEl}
              </View>
              <Text style={[styles.attachLabel, { color: textColor }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Image preview bar — shown when image is selected */}
        {pendingImage && (
          <View style={[styles.previewBar, { backgroundColor: headerBg, borderTopColor: borderColor }]}>
            <TouchableOpacity onPress={() => setFullscreenImage(pendingImage)} activeOpacity={0.85}>
              <Image source={{ uri: pendingImage }} style={styles.previewThumb} />
            </TouchableOpacity>
            <TextInput
              style={[styles.previewInput, { backgroundColor: inputBg, color: textColor }]}
              placeholder={t('addCaption')}
              placeholderTextColor={secondaryText}
              value={pendingCaption}
              onChangeText={setPendingCaption}
              multiline
              maxLength={300}
            />
            <TouchableOpacity onPress={sendImageWithCaption}
              style={[styles.previewSendBtn, { backgroundColor: astrologer.primaryColor }]}>
              <Ionicons name="arrow-up" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setPendingImage(null); setPendingCaption(''); }}
              style={styles.previewCancelBtn}>
              <XIcon size={18} color={secondaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.inputBar, { borderTopColor: borderColor, paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}
          >

            {isRecording ? (
              /* ── Recording bar ── */
              <>
                {/* Cancel */}
                <TouchableOpacity onPress={() => stopRecording(true)}
                  style={[styles.iconBtn, { backgroundColor: 'rgba(231,76,60,0.12)' }]}>
                  <TrashIcon size={20} color="#E74C3C" />
                </TouchableOpacity>

                {/* Live waveform + timer */}
                <View style={[styles.liveWaveBox, { backgroundColor: inputBg }]}>
                  <View style={styles.recordDotWrap}>
                    <RecordDot />
                  </View>
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

                {/* Send voice */}
                <TouchableOpacity onPress={() => stopRecording(false)}
                  style={[styles.iconBtn, { backgroundColor: astrologer.primaryColor }]}>
                  <SendIcon size={18} color="#FFF" />
                </TouchableOpacity>
              </>
            ) : (
              /* ── Normal bar ── */
              <>
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: showAttach ? '#9D4EDD' : (isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0') }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAttach(v => !v); }}
                >
                  {showAttach ? <XIcon size={22} color="#FFF" /> : isDark ? <AddSquareBoldIcon size={22} color="#FFF" /> : <AddSquareLinearIcon size={22} color="#1C1C1E" />}
                </TouchableOpacity>

                <View style={[styles.inputWrap, { backgroundColor: inputBg }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={t('messagePh')}
                    placeholderTextColor={secondaryText}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline maxLength={500}
                    onFocus={() => setShowAttach(false)}
                  />
                  {hasText ? (
                    <TouchableOpacity onPress={() => sendMessage()}
                      style={[styles.inlineBtn, { backgroundColor: astrologer.primaryColor }]}>
                      <Ionicons name="arrow-up" size={18} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={toggleRecording}
                      style={styles.inlineBtn}>
                      {isDark ? <MicBoldIcon size={20} color="#FFF" /> : <MicLinearIcon size={20} color="#1C1C1E" />}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── 3-dot menu ── */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.sheet, { backgroundColor: isDark ? '#1E1E30' : '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <Image source={astrologer.avatar} style={styles.sheetAvatar} />
              <View>
                <Text style={[styles.sheetName, { color: textColor }]}>{astrologer.name}</Text>
                <Text style={[styles.sheetRole, { color: secondaryText }]}>{astrologer.title}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {[
              { icon: 'person-circle-outline', label: 'View Profile', action: () => { setShowMenu(false); navigation.navigate('AstrologerProfile', { astrologer }); } },
              { icon: isMuted ? 'volume-high-outline' : 'volume-mute-outline', label: isMuted ? 'Unmute Notifications' : 'Mute Notifications', action: () => { setIsMuted(v => !v); setShowMenu(false); } },
              { icon: 'trash-outline', label: 'Clear Chat', action: () => { setShowMenu(false); Alert.alert('Clear Chat', 'Delete all messages?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem(chatKey); setMessages(INITIAL_MESSAGES(astrologer.name)); } }]); } },
              { icon: 'flag-outline', label: 'Report', color: '#E74C3C', action: openReport },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={styles.menuItem}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); item.action(); }}>
                <Ionicons name={item.icon as any} size={20} color={item.color ?? (isDark ? 'rgba(255,255,255,0.7)' : '#374151')} />
                <Text style={[styles.menuItemText, { color: item.color ?? textColor }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={() => setShowMenu(false)}
              style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
              <Text style={[styles.closeBtnText, { color: secondaryText }]}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Report modal ── */}
      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.overlay} onPress={() => setShowReport(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: isDark ? '#1E1E30' : '#FFFFFF' }]} onPress={() => {}}>

              {reportStep === 1 ? (
                <>
                  <View style={styles.sheetTitleRow}>
                    <Text style={[styles.sheetTitle, { color: textColor }]}>{t('reportAstrologer')}</Text>
                    <Text style={[styles.sheetStep, { color: secondaryText }]}>1 / 2</Text>
                  </View>
                  <Text style={[styles.sheetSubtitle, { color: secondaryText }]}>{t('reportReason')}</Text>
                  {REPORT_REASONS.map(r => (
                    <TouchableOpacity key={r} style={[styles.reasonRow, reportReason === r && styles.reasonRowActive]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReportReason(r); }}>
                      <View style={[styles.radio, reportReason === r && styles.radioActive]}>
                        {reportReason === r && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.reasonText, { color: textColor }]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => reportReason ? setReportStep(2) : null}
                    style={[styles.nextBtn, { backgroundColor: reportReason ? '#9D4EDD' : (isDark ? '#333' : '#DDD') }]}>
                    <Text style={[styles.nextBtnText, { color: reportReason ? '#FFF' : secondaryText }]}>{t('next')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <View style={styles.sheetTitleRow}>
                    <TouchableOpacity onPress={() => setReportStep(1)} style={styles.backBtn}>
                      <ArrowCircleLeftIcon size={20} color={secondaryText} />
                    </TouchableOpacity>
                    <Text style={[styles.sheetTitle, { color: textColor }]}>{t('additionalDetails')}</Text>
                    <Text style={[styles.sheetStep, { color: secondaryText }]}>2 / 2</Text>
                  </View>
                  <Text style={[styles.sheetSubtitle, { color: secondaryText }]}>
                    Reason: <Text style={{ color: '#9D4EDD', fontWeight: '600' }}>{reportReason}</Text>
                  </Text>
                  <TextInput
                    style={[styles.reportInput, { backgroundColor: inputBg, color: textColor, borderColor }]}
                    placeholder={t('describeHappened')}
                    placeholderTextColor={secondaryText}
                    multiline
                    numberOfLines={4}
                    value={reportDetail}
                    onChangeText={setReportDetail}
                    textAlignVertical="top"
                    autoFocus
                  />
                  <TouchableOpacity onPress={submitReport}
                    style={[styles.nextBtn, { backgroundColor: '#E74C3C' }]}>
                    <Ionicons name="flag" size={16} color="#FFF" />
                    <Text style={[styles.nextBtnText, { color: '#FFF' }]}>{t('submitReport')}</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      {/* ── Fullscreen image viewer ── */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
        <View style={styles.fullscreenBg}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={styles.fullscreenHeader}>
              <TouchableOpacity onPress={() => setFullscreenImage(null)} style={styles.fullscreenClose}>
                <XIcon size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Image source={{ uri: fullscreenImage! }} style={styles.fullscreenImage} resizeMode="contain" />
            <View style={styles.fullscreenFooter}>
              <TouchableOpacity onPress={shareFullscreenImage} style={styles.fullscreenShareBtn}>
                <ShareIcon size={20} color="#FFF" />
                <Text style={styles.fullscreenShareText}>Save / Share</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

// ─── Pulsing record dot ───────────────────────────────────────────────────────
const RecordDot: React.FC = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.5, duration: 500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[styles.recDot, { transform: [{ scale: pulse }] }]} />;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  onlineDot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ADE80', borderWidth: 2 },
  headerName: { fontSize: 15, fontWeight: '700' },
  headerSub: { fontSize: 11, marginTop: 1 },

  msgList: { flex: 1 },
  msgListContent: { padding: Spacing.lg, gap: 12, paddingBottom: 20 },
  msgGroup: { gap: 2 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  smallAvatar: { width: 30, height: 30, borderRadius: 15, flexShrink: 0 },
  avatarFallback: { backgroundColor: '#9D4EDD', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  msgBody: { flexShrink: 1, maxWidth: '80%' },
  bubble: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 18 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  imgBubble: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  msgImage: { width: 200, height: 200, resizeMode: 'cover' },
  // msgTime styles removed — timestamps now inside bubbles
  typingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, gap: 8 },
  typingLabel: { fontSize: 12 },

  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  waitingText: { fontSize: 12 },

  // Voice bubble — vertical layout (waveform top, duration bottom)
  voiceBubble: {
    flexDirection: 'column',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8,
    borderRadius: 18, minWidth: 200,
  },
  voiceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  voiceBottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
  },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 32 },
  waveBar: { width: 2.5, borderRadius: 2, minHeight: 3 },
  voiceDuration: {
    fontSize: 11, fontWeight: '600',
  },
  bubbleTime: { fontSize: 10, alignSelf: 'flex-end' as const, marginTop: 4 },
  imgTimeOverlay: {
    position: 'absolute' as const, bottom: 6, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  imgTimeText: { color: '#FFF', fontSize: 10, fontWeight: '500' as const },

  // Scroll to bottom
  scrollToBottomBtn: {
    position: 'absolute', bottom: 14, right: 14,
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },

  // Image preview bar
  previewBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, gap: 6,
  },
  previewThumb: { width: 52, height: 52, borderRadius: 10, flexShrink: 0 },
  previewInput: {
    flex: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, maxHeight: 80,
  },
  previewSendBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  previewCancelBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  captionBubble: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, marginTop: 3,
  },

  // Fullscreen image
  fullscreenBg: { flex: 1, backgroundColor: '#000' },
  fullscreenHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  fullscreenClose: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  fullscreenImage: { flex: 1 },
  fullscreenFooter: { paddingVertical: 20, alignItems: 'center' },
  fullscreenShareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 28,
  },
  fullscreenShareText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // Attach panel
  attachPanel: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: 12, borderTopWidth: 1, gap: 8 },
  attachItem: { flex: 1, alignItems: 'center', gap: 6 },
  attachIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  attachLabel: { fontSize: 11, fontWeight: '500' },

  // Input bar
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, gap: 8, overflow: 'hidden' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingLeft: 14, paddingRight: 6, minHeight: 40 },
  input: { flex: 1, fontSize: 14, paddingVertical: 8, maxHeight: 100 },
  inlineBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },

  // Recording bar
  liveWaveBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, gap: 8, minHeight: 40 },
  recordDotWrap: { width: 14, alignItems: 'center' },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E74C3C' },
  recordTimer: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 36 },
  liveWaveInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, overflow: 'hidden' },
  liveBar: { width: 2.5, borderRadius: 2, minHeight: 3 },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingBottom: 28, paddingHorizontal: 0, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  sheetAvatar: { width: 46, height: 46, borderRadius: 23 },
  sheetName: { fontSize: 16, fontWeight: '700' },
  sheetRole: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 15 },
  menuItemText: { fontSize: 15, fontWeight: '500' },
  closeBtn: { marginHorizontal: 20, marginTop: 8, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '600' },

  // Report modal
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, gap: 8 },
  backBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  sheetStep: { fontSize: 12 },
  sheetSubtitle: { fontSize: 13, paddingHorizontal: 20, marginBottom: 12, marginTop: 4 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginHorizontal: 12 },
  reasonRowActive: { backgroundColor: 'rgba(157,78,221,0.1)' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#9D4EDD', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#9D4EDD' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9D4EDD' },
  reasonText: { fontSize: 14, flex: 1 },
  reportInput: { marginHorizontal: 20, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 100, borderWidth: 1, marginBottom: 16 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 8, paddingVertical: 14, borderRadius: 14 },
  nextBtnText: { fontSize: 15, fontWeight: '700' },
});
