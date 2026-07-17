// Zustand Global Store
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, StreakData } from '../types';
import { ThemeMode } from '../config/theme';
import { signOut as apiSignOut, clearJwt, deductTokens } from '../services/api';
import { ASTROLOGERS } from '../data/astrologers';
import { setUserID as rcSetUserID, logOut as rcLogOut } from '../services/revenueCat';

const isGuestUser = (u: User | null): boolean => !u?.id || u.id.startsWith('guest_') || u.id.startsWith('local_');

interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Theme
  theme: ThemeMode;

  // Language
  language: string;

  // Streak
  streak: StreakData;

  // Friends
  friends: string[]; // array of user IDs or nicknames

  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
  setStreak: (streak: StreakData) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  // Token actions
  addTokens: (amount: number) => void;
  removeTokens: (amount: number) => boolean;

  // Friends
  addFriend: (id: string) => void;
  removeFriend: (id: string) => void;

  // Persistence
  loadPersistedState: () => Promise<void>;
  persistState: () => Promise<void>;
}

const initialStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastClaimDate: null,
  totalTokensEarned: 0,
};

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  theme: 'dark',
  language: 'tr',
  streak: initialStreak,
  friends: [],

  // User actions
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    get().persistState();
    // Align RevenueCat's identity with our backend user id so the
    // RevenueCat webhook can map purchase events back to this user.
    // Guest/local-fallback ids never exist in the backend, so skip those.
    if (user && !isGuestUser(user)) {
      rcSetUserID(user.id).catch(() => {});
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
      get().persistState();
    }
  },

  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem('theme', theme);
  },

  setLanguage: async (language) => {
    set({ language });
    await AsyncStorage.setItem('language', language);
  },

  setStreak: (streak) => {
    set({ streak });
    get().persistState();
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    // Clear backend session + JWT from SecureStore
    try {
      await apiSignOut();
    } catch {
      // Backend might be unreachable — still clear JWT locally
      await clearJwt();
    }
    set({
      user: null,
      isAuthenticated: false,
      streak: initialStreak,
    });
    await AsyncStorage.multiRemove(['user', 'streak']);
    rcLogOut().catch(() => {});
  },

  // Friends
  addFriend: (id) => {
    const current = get().friends;
    if (!current.includes(id)) {
      set({ friends: [...current, id] });
      get().persistState();
    }
  },
  removeFriend: (id) => {
    set({ friends: get().friends.filter(f => f !== id) });
    get().persistState();
  },

  // Token actions
  addTokens: (amount) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: { ...currentUser, tokens: currentUser.tokens + amount },
      });
      get().persistState();
    }
  },

  removeTokens: (amount) => {
    const currentUser = get().user;
    if (currentUser && currentUser.tokens >= amount) {
      // Optimistic local deduction for instant UI…
      set({ user: { ...currentUser, tokens: currentUser.tokens - amount } });
      get().persistState();
      // …then persist to the backend (source of truth) so it survives re-login.
      // Guests/local accounts stay device-only.
      if (!isGuestUser(currentUser)) {
        deductTokens(amount)
          .then((res) => {
            const u = get().user;
            if (u && typeof res.token_balance === 'number') {
              set({ user: { ...u, tokens: res.token_balance } });
              get().persistState();
            }
          })
          .catch(() => { /* offline: keep optimistic value; backend reconciles on next sync */ });
      }
      return true;
    }
    return false;
  },

  // Persistence
  loadPersistedState: async () => {
    try {
      const [userJson, themeValue, languageValue, streakJson, friendsJson] =
        await AsyncStorage.multiGet(['user', 'theme', 'language', 'streak', 'friends']);

      const user = userJson[1] ? JSON.parse(userJson[1]) : null;
      const theme = (themeValue[1] as ThemeMode) || 'dark';
      const language = languageValue[1] || 'tr';
      const streak = streakJson[1] ? JSON.parse(streakJson[1]) : initialStreak;
      const storedFriends: string[] = friendsJson[1] ? JSON.parse(friendsJson[1]) : [];

      // Reconcile: keep only ids that map to a real astrologer. Drops orphaned
      // entries left by an earlier inconsistent add path (so the profile "Friends"
      // count can't show a phantom that the Messages list never displays).
      const validIds = new Set(ASTROLOGERS.map(a => a.id));
      const friends = storedFriends.filter(id => validIds.has(id));
      if (friends.length !== storedFriends.length) {
        AsyncStorage.setItem('friends', JSON.stringify(friends)).catch(() => {});
      }

      set({
        user,
        isAuthenticated: !!user,
        theme,
        language,
        streak,
        friends,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading persisted state:', error);
      set({ isLoading: false });
    }
  },

  persistState: async () => {
    try {
      const { user, streak, friends } = get();
      await AsyncStorage.multiSet([
        ['user', user ? JSON.stringify(user) : ''],
        ['streak', JSON.stringify(streak)],
        ['friends', JSON.stringify(friends)],
      ]);
    } catch (error) {
      console.error('Error persisting state:', error);
    }
  },
}));
