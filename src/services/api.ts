// Go Backend API Client
// All requests go through this module. AuthScreen and other services
// should import from here.

import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { AppConfig } from '../config/appConfig';

// ─── Config ───────────────────────────────────────────────────────────────────
const getBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_GO_BACKEND_URL;
  if (url) return url;
  if (__DEV__) return 'http://localhost:8080';
  throw new Error('EXPO_PUBLIC_GO_BACKEND_URL is not set');
};

const TOKEN_KEY = 'jwt_token';
const FETCH_TIMEOUT_MS = 10000; // 10s general
const AUTH_TIMEOUT_MS = 8000;   // 8s for auth (was 15s)

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const saveJwt = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getJwt = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const clearJwt = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<T> {
  const BASE_URL = getBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requireAuth) {
    const token = await getJwt();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (response.status === 401) {
      await clearJwt();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        message = body.error || body.message || message;
      } catch (_) { }
      throw new Error(message);
    }

    // 204 No Content
    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  auth_id: string;
  email: string;
  nickname: string;
  profile_image_url?: string;
  bio?: string;
  language_code: string;
  tokens: number;
  is_premium: boolean;
  onboarding_completed: boolean;
  birth_date?: string;
  birth_time?: string;
  birth_city?: string;
  zodiac_sign?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

/**
 * Maps a backend ApiUser (snake_case) to the app's User model (camelCase).
 * Single source of truth — used by every auth flow so the shape stays consistent.
 */
export const apiUserToUser = (u: ApiUser, fallbackLanguage = 'tr'): User => ({
  id: u.id,
  authId: u.auth_id,
  nickname: u.nickname,
  email: u.email,
  profileImageUrl: u.profile_image_url,
  bio: u.bio,
  languageCode: u.language_code || fallbackLanguage,
  tokens: u.tokens ?? AppConfig.defaultTokens,
  isPremium: u.is_premium ?? false,
  onboardingCompleted: u.onboarding_completed ?? false,
  birthDate: u.birth_date,
  birthTime: u.birth_time,
  birthCity: u.birth_city,
  zodiacSign: u.zodiac_sign,
  role: (u.role as User['role']) || 'user',
  createdAt: u.created_at,
  updatedAt: u.updated_at,
});

export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
  last_claim_date: string | null;
  total_tokens_earned: number;
  can_claim_today: boolean;
  today_reward: number;
}

export interface StreakClaimResponse {
  success: boolean;
  tokens_awarded: number;
  new_streak: number;
  longest_streak: number;
  token_balance: number;
  is_weekly_bonus: boolean;
}

// ─── Local user cache (for offline access after successful backend registration) ──
const LOCAL_USERS_KEY = 'kosmos_local_users';

interface LocalUserCache {
  id: string;          // backend user ID
  email: string;
  passwordHash: string;
  nickname: string;
  tokens: number;
  createdAt: string;
}

const simpleHash = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h.toString(36);
};

const getLocalUsers = async (): Promise<LocalUserCache[]> => {
  const raw = await SecureStore.getItemAsync(LOCAL_USERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalUsers = async (users: LocalUserCache[]) => {
  await SecureStore.setItemAsync(LOCAL_USERS_KEY, JSON.stringify(users));
};

const cacheUserLocally = async (email: string, password: string, user: ApiUser) => {
  const users = await getLocalUsers();
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    // Update existing cache entry
    const updated = users.map(u =>
      u.email.toLowerCase() === email.toLowerCase()
        ? { ...u, id: user.id, nickname: user.nickname, tokens: user.tokens }
        : u
    );
    await saveLocalUsers(updated);
  } else {
    await saveLocalUsers([...users, {
      id: user.id,
      email: user.email,
      passwordHash: simpleHash(password),
      nickname: user.nickname,
      tokens: user.tokens,
      createdAt: user.created_at,
    }]);
  }
};

const makeLocalAuthResponse = (u: LocalUserCache): AuthResponse => ({
  token: `local_${u.id}`,
  user: {
    id: u.id,
    auth_id: u.id,
    email: u.email,
    nickname: u.nickname,
    language_code: 'tr',
    tokens: u.tokens,
    is_premium: false,
    onboarding_completed: false,
    created_at: u.createdAt,
    updated_at: u.createdAt,
  },
});

const isNetworkError = (e: unknown): boolean => {
  const msg = (e as Error)?.message || '';
  return msg.includes('Network') || msg.includes('fetch') || msg.includes('timed out') || msg.includes('Failed to fetch') || msg.includes('aborted') || msg.includes('Aborted');
};

// ─── Auth ──────────────────────────────────────────────────────────────────────

/**
 * SIGN IN — Backend-first.
 * 1. Try Go backend (PostgreSQL) — this is the source of truth
 * 2. If backend succeeds → cache user locally for future offline access
 * 3. If backend unreachable AND running in __DEV__ → try local cache as a dev-only fallback
 *    (offline dev testing). In production this would silently hand out a fake
 *    `local_<id>` token that the backend can never validate, so every
 *    subsequent authenticated request would fail with no clear explanation —
 *    real users must instead see a clear "can't reach server" error.
 */
export const signIn = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  // ── 1. Try backend first (source of truth) ──
  try {
    const data = await apiFetch<AuthResponse>(
      '/api/v1/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false,
      AUTH_TIMEOUT_MS,
    );
    await saveJwt(data.token);
    // Cache locally for offline access
    await cacheUserLocally(email, password, data.user);
    return data;
  } catch (e) {
    if (!isNetworkError(e)) throw e; // real error (wrong password etc.) — propagate
    if (!__DEV__) {
      throw new Error('Could not connect to server. Please check your internet connection and try again.');
    }
    console.log('[auth] Backend unreachable, trying local cache (dev only)');
  }

  // ── 2. Backend unreachable — dev-only local cache fallback ──
  const users = await getLocalUsers();
  const cached = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!cached) {
    throw new Error('Could not connect to server. Please check your internet connection.');
  }
  if (cached.passwordHash !== simpleHash(password)) {
    throw new Error('Invalid email or password.');
  }
  const res = makeLocalAuthResponse(cached);
  await saveJwt(res.token);
  return res;
};

/**
 * SIGN UP — Backend-first.
 * 1. Register on Go backend (PostgreSQL) — user appears in admin panel
 * 2. Cache user locally
 * 3. If backend unreachable → clear error message, do NOT create ghost users
 */
export const signUp = async (
  email: string,
  password: string,
  nickname: string,
  language_code = 'tr',
): Promise<AuthResponse> => {
  try {
    const data = await apiFetch<AuthResponse>(
      '/api/v1/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, nickname, language_code }) },
      false,
      AUTH_TIMEOUT_MS,
    );
    await saveJwt(data.token);
    // Cache locally for offline access
    await cacheUserLocally(email, password, data.user);
    return data;
  } catch (e) {
    if (!isNetworkError(e)) throw e; // real error (duplicate email etc.) — propagate
    // Registration requires the backend (source of truth) — no ghost local accounts.
    throw new Error(
      'Could not connect to server. Please check your internet connection and try again.'
    );
  }
};

/** No longer needed — kept as no-op for backward compatibility */
export const syncPendingUsers = async (): Promise<void> => {};

export const checkNicknameAvailable = async (nickname: string): Promise<boolean> => {
  try {
    const data = await apiFetch<{ available: boolean }>(
      `/api/v1/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
      { method: 'GET' },
      false,
      AUTH_TIMEOUT_MS,
    );
    return data.available;
  } catch {
    return true; // if backend unreachable, let signUp handle the duplicate check
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
  } finally {
    await clearJwt();
  }
};

// ─── Email Verification ───────────────────────────────────────────────────────

interface SendCodeResponse {
  success: boolean;
  message: string;
  dev_code?: string; // only in dev mode when SMTP is not configured
}

export const sendVerificationCode = async (email: string): Promise<SendCodeResponse> => {
  return apiFetch<SendCodeResponse>(
    '/api/v1/auth/send-code',
    { method: 'POST', body: JSON.stringify({ email }) },
    false,
    AUTH_TIMEOUT_MS,
  );
};

export const verifyCode = async (email: string, code: string): Promise<{ success: boolean; message: string }> => {
  return apiFetch<{ success: boolean; message: string }>(
    '/api/v1/auth/verify-code',
    { method: 'POST', body: JSON.stringify({ email, code }) },
    false,
    AUTH_TIMEOUT_MS,
  );
};

// ─── Password Reset / Change ──────────────────────────────────────────────────

export const sendPasswordResetCode = async (email: string): Promise<SendCodeResponse> => {
  return apiFetch<SendCodeResponse>(
    '/api/v1/auth/send-reset-code',
    { method: 'POST', body: JSON.stringify({ email }) },
    false,
    AUTH_TIMEOUT_MS,
  );
};

export const resetPassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  return apiFetch<{ success: boolean; message: string }>(
    '/api/v1/auth/reset-password',
    { method: 'POST', body: JSON.stringify({ email, code, new_password: newPassword }) },
    false,
    AUTH_TIMEOUT_MS,
  );
};

export const changePassword = async (
  params: { current_password: string; new_password: string } | { code: string; new_password: string },
): Promise<{ success: boolean; message: string }> => {
  return apiFetch<{ success: boolean; message: string }>(
    '/api/v1/users/me/password',
    { method: 'PUT', body: JSON.stringify(params) },
  );
};

// ─── User ──────────────────────────────────────────────────────────────────────
export const getMe = async (): Promise<ApiUser> => {
  const res = await apiFetch<{ success: boolean; user: ApiUser }>('/api/v1/users/me', { method: 'GET' });
  return res.user;
};

export const updateMe = async (updates: Partial<ApiUser>): Promise<ApiUser> => {
  const res = await apiFetch<{ success: boolean; user: ApiUser }>('/api/v1/users/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return res.user;
};

// ─── Streak ────────────────────────────────────────────────────────────────────
export const getStreak = async (): Promise<StreakResponse> => {
  const res = await apiFetch<{ success: boolean; streak: StreakResponse }>('/api/v1/streak', { method: 'GET' });
  return res.streak;
};

export const claimDailyStreak = async (): Promise<StreakClaimResponse> => {
  return apiFetch<StreakClaimResponse>('/api/v1/streak/claim', { method: 'POST' });
};

// ─── Push notifications ──────────────────────────────────────────────────────
/** Best-effort: register this device's Expo push token with the backend (needs JWT). */
export const registerPushToken = async (token: string, platform: string): Promise<void> => {
  try {
    await apiFetch('/api/v1/users/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  } catch (e) {
    if (__DEV__) console.warn('[api] registerPushToken failed (non-fatal):', (e as Error).message);
  }
};

// ─── Astrologers ───────────────────────────────────────────────────────────────
export interface ApiAstrologer {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo_url: string;
  specialties: string[];
  rating: number;
  review_count: number;
  price: number;
  is_online: boolean;
  is_ai: boolean;
}

export const getAstrologers = async (): Promise<ApiAstrologer[]> => {
  const res = await apiFetch<{ success: boolean; data: ApiAstrologer[] }>(
    '/api/v1/astrologers', { method: 'GET' }, false,
  );
  return res.data || [];
};

// ─── Token Packages ────────────────────────────────────────────────────────────
export interface ApiTokenPackage {
  id: string;
  name: string;
  token_amount: number;
  price_tl: number;
  bonus_percent: number;
  is_popular: boolean;
  display_order: number;
}

export const getTokenPackages = async (): Promise<ApiTokenPackage[]> => {
  const res = await apiFetch<{ success: boolean; data: ApiTokenPackage[] }>(
    '/api/v1/tokens/packages', { method: 'GET' }, false,
  );
  return res.data || [];
};

// ─── Campaigns / Promo Codes ───────────────────────────────────────────────────
export interface PromoCodeResult {
  id: string;
  title: string;
  code: string;
  discount_percent: number;
  discount_tokens: number;
}

export const validatePromoCode = async (code: string): Promise<PromoCodeResult> => {
  const res = await apiFetch<{ success: boolean; campaign: PromoCodeResult }>(
    '/api/v1/campaigns/validate',
    { method: 'POST', body: JSON.stringify({ code: code.toUpperCase().trim() }) },
    false,
  );
  return res.campaign;
};

// ─── Tokens ────────────────────────────────────────────────────────────────────
/**
 * Validates a token package still exists and returns the current balance.
 * This does NOT credit tokens — only the RevenueCat webhook does that, once
 * the purchase is confirmed server-side. Use this as a pre-flight check
 * before initiating a RevenueCat purchase.
 */
export const purchaseTokens = async (
  packageId: string,
): Promise<{ tokens: number; new_total: number }> => {
  const res = await apiFetch<{ success: boolean; tokens_added: number; token_balance: number }>(
    '/api/v1/tokens/purchase',
    {
      method: 'POST',
      body: JSON.stringify({ package_id: packageId }),
    },
  );
  return { tokens: res.tokens_added, new_total: res.token_balance };
};

/** Claim tokens for having watched a rewarded ad. Daily limit is enforced server-side. */
export const claimAdReward = async (): Promise<{ tokens: number; new_total: number }> => {
  const res = await apiFetch<{ success: boolean; tokens_added: number; token_balance: number }>(
    '/api/v1/tokens/ad-reward',
    { method: 'POST', body: JSON.stringify({}) },
  );
  return { tokens: res.tokens_added, new_total: res.token_balance };
};

/** Deduct tokens server-side (source of truth). Returns the authoritative new balance. */
export const deductTokens = async (
  amount: number,
  description = 'Feature usage',
): Promise<{ success: boolean; tokens_used: number; token_balance: number }> => {
  return apiFetch('/api/v1/tokens/deduct', {
    method: 'POST',
    body: JSON.stringify({ amount, description }),
  });
};

// ─── Readings ──────────────────────────────────────────────────────────────────
export interface ApiReading {
  id: string;
  type: string;
  prompt: string;
  response: string;
  tokens_used: number;
  created_at: string;
}

export const saveReading = (
  type: string,
  prompt: string,
  response: string,
  tokensUsed: number,
): Promise<{ success: boolean; id: string }> =>
  apiFetch('/api/v1/readings', {
    method: 'POST',
    body: JSON.stringify({ type, prompt, response, tokens_used: tokensUsed }),
  });

export const getReadings = (
  type?: string,
  limit = 20,
): Promise<{ success: boolean; data: ApiReading[] }> =>
  apiFetch(`/api/v1/readings?${type ? `type=${encodeURIComponent(type)}&` : ''}limit=${limit}`);

// ─── Conversations ─────────────────────────────────────────────────────────────
export interface ApiConversation {
  id: string;
  astrologer_name: string;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
}

export interface ApiMessage {
  id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

export const getConversations = (): Promise<{ success: boolean; data: ApiConversation[] }> =>
  apiFetch('/api/v1/conversations');

export const getOrCreateConversation = (astrologerName: string): Promise<ApiConversation> =>
  apiFetch('/api/v1/conversations', {
    method: 'POST',
    body: JSON.stringify({ astrologer_name: astrologerName }),
  });

export const getConversationMessages = (
  convId: string,
  limit = 100,
): Promise<{ success: boolean; data: ApiMessage[] }> =>
  apiFetch(`/api/v1/conversations/${encodeURIComponent(convId)}/messages?limit=${limit}`);

export const postMessage = (
  convId: string,
  content: string,
  isUser: boolean,
  mediaUrl?: string,
  mediaType?: 'image' | 'voice' | 'video',
): Promise<{ success: boolean }> =>
  apiFetch(`/api/v1/conversations/${encodeURIComponent(convId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content,
      is_user: isUser,
      ...(mediaUrl ? { media_url: mediaUrl, media_type: mediaType } : {}),
    }),
  });

// ─── Media upload ──────────────────────────────────────────────────────────────
export const uploadMedia = async (
  fileUri: string,
  mediaType: 'image' | 'voice' | 'video',
): Promise<{ success: boolean; url: string }> => {
  const formData = new FormData();
  const ext = fileUri.split('.').pop() || (mediaType === 'voice' ? 'm4a' : 'jpg');
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    m4a: 'audio/m4a', mp4: 'video/mp4', mov: 'video/quicktime',
  };
  formData.append('file', {
    uri: fileUri,
    name: `${mediaType}_${Date.now()}.${ext}`,
    type: mimeMap[ext] || 'application/octet-stream',
  } as any);
  formData.append('media_type', mediaType);
  return apiFetch('/api/v1/media/upload', {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ─── Forum ─────────────────────────────────────────────────────────────────────
export interface ApiForumQuestion {
  id: string;
  nickname: string;
  title: string;
  content: string;
  category: string;
  answer_count: number;
  created_at: string;
}

export interface ApiForumAnswer {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
}

export const getForumQuestions = (
  category?: string,
): Promise<{ success: boolean; data: ApiForumQuestion[] }> =>
  apiFetch(
    `/api/v1/forum/questions${category ? `?category=${encodeURIComponent(category)}` : ''}`,
  );

export const postForumQuestion = (
  title: string,
  content: string,
  category: string,
): Promise<{ success: boolean; id: string }> =>
  apiFetch('/api/v1/forum/questions', {
    method: 'POST',
    body: JSON.stringify({ title, content, category }),
  });

export const getForumAnswers = (
  questionId: string,
): Promise<{ success: boolean; data: ApiForumAnswer[] }> =>
  apiFetch(`/api/v1/forum/questions/${encodeURIComponent(questionId)}/answers`);

export const postForumAnswer = (
  questionId: string,
  content: string,
): Promise<{ success: boolean }> =>
  apiFetch(`/api/v1/forum/questions/${encodeURIComponent(questionId)}/answers`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

// ─── Notifications ────────────────────────────────────────────────────────────
export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string;
  is_read: boolean;
  created_at: string;
}

export const getNotifications = (
  limit = 30,
): Promise<{ success: boolean; data: ApiNotification[] }> =>
  apiFetch(`/api/v1/notifications?limit=${limit}`);

export const getUnreadCount = (): Promise<{ count: number }> =>
  apiFetch('/api/v1/notifications/unread-count');

export const markNotificationRead = (id: string): Promise<{ success: boolean }> =>
  apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' });

export const markAllNotificationsRead = (): Promise<{ success: boolean }> =>
  apiFetch('/api/v1/notifications/read-all', { method: 'PUT' });

// ─── Astrologer Panel (for real astrologers) ──────────────────────────────────
export interface AstrologerConversation {
  id: string;
  user_id: string;
  nickname: string;
  avatar: string;
  last_message: string;
  last_message_at: string;
}

export const getMyConversations = (): Promise<{ success: boolean; data: AstrologerConversation[] }> =>
  apiFetch('/api/v1/astrologers/me/conversations');

export const postAstrologerReply = (
  convId: string,
  content: string,
): Promise<{ success: boolean }> =>
  apiFetch(`/api/v1/astrologers/me/conversations/${encodeURIComponent(convId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

export interface AstrologerEarnings {
  success: boolean;
  total_clients: number;
  total_messages: number;
  total_replies: number;
}

export const getMyEarnings = (): Promise<AstrologerEarnings> =>
  apiFetch('/api/v1/astrologers/me/earnings');

// ─── Astrologer Applications ─────────────────────────────────────────────────
export interface ApplicationData {
  full_name: string;
  title: string;
  specialties: string[];
  experience_years: number;
  bio: string;
  social_link?: string;
}

export const submitApplication = (data: ApplicationData): Promise<{ success: boolean; message: string }> =>
  apiFetch('/api/v1/applications', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      specialties: data.specialties.join(','), // backend expects comma-separated string
    }),
  });

export interface MyApplicationStatus {
  success: boolean;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at?: string;
  id?: string;
}

export const getMyApplicationStatus = (): Promise<MyApplicationStatus> =>
  apiFetch('/api/v1/applications/me');

// ── Analytics Events ─────────────────────────────────────────────────────────
export interface TrackEventPayload {
  event_type: string;
  event_data?: Record<string, any>;
  screen?: string;
  platform?: string;
  app_version?: string;
  timestamp?: string;
}

export const postEvents = (events: TrackEventPayload[]): Promise<{ success: boolean; inserted: number }> =>
  apiFetch('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify({ events }),
  });

export const startSession = (platform: string, appVersion: string): Promise<{ success: boolean; session_id: string }> =>
  apiFetch('/api/v1/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ platform, app_version: appVersion }),
  });

export const endSession = (sessionId: string): Promise<{ success: boolean }> =>
  apiFetch(`/api/v1/sessions/${sessionId}/end`, { method: 'PUT' });

export const createMilestone = (milestone: string, metadata?: Record<string, any>): Promise<{ success: boolean }> =>
  apiFetch('/api/v1/milestones', {
    method: 'POST',
    body: JSON.stringify({ milestone, metadata }),
  });

// ── Social: user discovery, friends (request/accept), direct messages ─────────
export type FriendshipStatus = 'none' | 'pending_out' | 'pending_in' | 'friends';

export interface DiscoverUser {
  id: string;
  nickname: string;
  profile_image_url?: string | null;
  zodiac_sign?: string | null;
  online: boolean;
  friendship_status: FriendshipStatus;
  friendship_id?: string | null;
}

export interface FriendUser {
  id: string;
  nickname: string;
  profile_image_url?: string | null;
  zodiac_sign?: string | null;
  online: boolean;
}

export interface FriendRequest {
  request_id: string;
  id: string;
  nickname: string;
  profile_image_url?: string | null;
  zodiac_sign?: string | null;
}

export interface DMThread {
  user_id: string;
  nickname: string;
  profile_image_url?: string | null;
  online: boolean;
  last_message: string;
  last_message_at: string;
  unread: number;
}

export interface DMMessage {
  id: string;
  content: string;
  is_mine: boolean;
  created_at: string;
}

export const discoverUsers = (q = ''): Promise<{ success: boolean; data: DiscoverUser[] }> =>
  apiFetch(`/api/v1/users/discover${q ? `?q=${encodeURIComponent(q)}` : ''}`);

export const sendFriendRequest = (addresseeId: string): Promise<{ success: boolean; status: FriendshipStatus }> =>
  apiFetch('/api/v1/friends/request', { method: 'POST', body: JSON.stringify({ addressee_id: addresseeId }) });

export const respondFriendRequest = (requestId: string, accept: boolean): Promise<{ success: boolean; status: string }> =>
  apiFetch('/api/v1/friends/respond', { method: 'POST', body: JSON.stringify({ request_id: requestId, accept }) });

export const getFriends = (): Promise<{ success: boolean; data: FriendUser[] }> =>
  apiFetch('/api/v1/friends');

export const getFriendRequests = (): Promise<{ success: boolean; data: FriendRequest[] }> =>
  apiFetch('/api/v1/friends/requests');

export const removeFriend = (userId: string): Promise<{ success: boolean }> =>
  apiFetch(`/api/v1/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' });

export const blockUser = (userId: string): Promise<{ success: boolean }> =>
  apiFetch(`/api/v1/block/${encodeURIComponent(userId)}`, { method: 'POST' });

export const unblockUser = (userId: string): Promise<{ success: boolean }> =>
  apiFetch(`/api/v1/block/${encodeURIComponent(userId)}`, { method: 'DELETE' });

export const getBlocked = (): Promise<{ success: boolean; data: FriendUser[] }> =>
  apiFetch('/api/v1/blocked');

export const getDMThreads = (): Promise<{ success: boolean; data: DMThread[] }> =>
  apiFetch('/api/v1/dm');

export const getDMMessages = (userId: string): Promise<{ success: boolean; data: DMMessage[] }> =>
  apiFetch(`/api/v1/dm/${encodeURIComponent(userId)}`);

export const sendDM = (userId: string, content: string): Promise<{ success: boolean; id: string; created_at: string }> =>
  apiFetch(`/api/v1/dm/${encodeURIComponent(userId)}`, { method: 'POST', body: JSON.stringify({ content }) });
