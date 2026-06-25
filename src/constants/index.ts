// Application Constants - Centralized Configuration

/**
 * App Information
 */
export const APP_NAME = 'Kosmos Astro';
export const APP_VERSION = '1.0.0';
export const APP_ID = 'com.kosmosastro.app';

/**
 * URLs
 */
export const WEBSITE_URL = 'https://kosmosastro.app';
export const PRIVACY_POLICY_URL = 'https://kosmosastro.app/privacy';
export const TERMS_OF_SERVICE_URL = 'https://kosmosastro.app/terms';
export const SUPPORT_EMAIL = 'support@kosmosastro.app';

/**
 * Navigation
 */
export const NAVIGATION_TIMEOUT = 5000;
export const NAVIGATION_DEBOUNCE = 300;

/**
 * Animations
 */
export const ANIMATION_DURATION_FAST = 150;
export const ANIMATION_DURATION_NORMAL = 300;
export const ANIMATION_DURATION_SLOW = 500;

/**
 * Layout
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const ICON_SIZE = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Font Sizes
 */
export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

/**
 * Colors - Dark Theme
 */
export const COLORS_DARK = {
  primary: '#e94560',
  secondary: '#0f3460',
  background: '#1a1a2e',
  surface: '#16213e',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  border: '#2a2a4a',
  success: '#4cd137',
  warning: '#fbc531',
  error: '#e84118',
  info: '#00a8ff',
};

/**
 * Colors - Light Theme
 */
export const COLORS_LIGHT = {
  primary: '#e94560',
  secondary: '#0f3460',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#666666',
  border: '#e0e0e0',
  success: '#4cd137',
  warning: '#fbc531',
  error: '#e84118',
  info: '#00a8ff',
};

/**
 * Zodiac Signs
 */
export const ZODIAC_SIGNS = [
  { name: 'Koç', symbol: '♈', dates: '21 Mart - 19 Nisan', english: 'aries' },
  { name: 'Boğa', symbol: '♉', dates: '20 Nisan - 20 Mayıs', english: 'taurus' },
  { name: 'İkizler', symbol: '♊', dates: '21 Mayıs - 20 Haziran', english: 'gemini' },
  { name: 'Yengeç', symbol: '♋', dates: '21 Haziran - 22 Temmuz', english: 'cancer' },
  { name: 'Aslan', symbol: '♌', dates: '23 Temmuz - 22 Ağustos', english: 'leo' },
  { name: 'Başak', symbol: '♍', dates: '23 Ağustos - 22 Eylül', english: 'virgo' },
  { name: 'Terazi', symbol: '♎', dates: '23 Eylül - 22 Ekim', english: 'libra' },
  { name: 'Akrep', symbol: '♏', dates: '23 Ekim - 21 Kasım', english: 'scorpio' },
  { name: 'Yay', symbol: '♐', dates: '22 Kasım - 21 Aralık', english: 'sagittarius' },
  { name: 'Oğlak', symbol: '♑', dates: '22 Aralık - 19 Ocak', english: 'capricorn' },
  { name: 'Kova', symbol: '♒', dates: '20 Ocak - 18 Şubat', english: 'aquarius' },
  { name: 'Balık', symbol: '♓', dates: '19 Şubat - 20 Mart', english: 'pisces' },
];

/**
 * Tarot Cards
 */
export const MAJOR_ARCANA = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
  'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
  'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
  'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World',
];

/**
 * Card Suits
 */
export const TAROT_SUITS = ['Wands', 'Cups', 'Swords', 'Pentacles'];
export const TAROT_NUMBERS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

/**
 * Chat Messages
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  SYSTEM: 'system',
  ERROR: 'error',
} as const;

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  INITIAL_PAGE: 1,
};

/**
 * Debounce and Throttle
 */
export const DEBOUNCE = {
  SEARCH: 300,
  INPUT: 500,
  BUTTON: 200,
};

export const THROTTLE = {
  SCROLL: 200,
  RESIZE: 300,
};

/**
 * Timeouts
 */
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  IMAGE_LOAD: 10000, // 10 seconds
  VIDEO_LOAD: 30000, // 30 seconds
  AUTO_DISMISS: 5000, // 5 seconds
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK: 'İnternet bağlantınızı kontrol edin',
  SERVER: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin',
  AUTH: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın',
  PERMISSION: 'Bu işlem için yetkiniz yok',
  VALIDATION: 'Girdiğiniz bilgileri kontrol edin',
  UNKNOWN: 'Bir hata oluştu',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  SAVED: 'Kaydedildi',
  DELETED: 'Silindi',
  UPDATED: 'Güncellendi',
  COPIED: 'Kopyalandı',
  SENT: 'Gönderildi',
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  THEME: '@kosmos_theme',
  LANGUAGE: '@kosmos_language',
  NOTIFICATIONS: '@kosmos_notifications',
  FIRST_LAUNCH: '@kosmos_first_launch',
  USER_PREFS: '@kosmos_user_prefs',
} as const;

/**
 * Regular Expressions
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^(\+90|0)?5\d{9}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
};

/**
 * Validation Limits
 */
export const VALIDATION_LIMITS = {
  USERNAME: {
    MIN: 3,
    MAX: 20,
  },
  PASSWORD: {
    MIN: 6,
    MAX: 128,
  },
  NICKNAME: {
    MIN: 2,
    MAX: 30,
  },
  BIO: {
    MIN: 0,
    MAX: 500,
  },
  MESSAGE: {
    MIN: 1,
    MAX: 2000,
  },
};

/**
 * Witch Level Names
 */
export const WITCH_LEVELS = [
  'Cırak Cadı',
  'Şifacı Cadı',
  'Bilge Cadı',
  'Usta Cadı',
  'Efsanevi Büyücü',
];

/**
 * Lucky Colors
 */
export const LUCKY_COLORS = [
  'Kırmızı', 'Mavi', 'Yeşil', 'Mor', 'Turuncu',
  'Sarı', 'Pembe', 'Beyaz', 'Siyah', 'Altın',
];

/**
 * Lucky Numbers (1-99)
 */
export const LUCKY_NUMBERS = Array.from({ length: 99 }, (_, i) => i + 1);

/**
 * Token System
 */
export const TOKEN_SYSTEM = {
  DISPLAY_NAME: 'Altın',
  DEFAULT_TOKENS: 30,
  STREAK_MIN_REWARD: 10,
  STREAK_MAX_REWARD: 15,
  EXTRA_AD_REWARD: 5,
  MAX_DAILY_ADS: 5,
  PREMIUM_DAILY_BONUS: 10,
} as const;

/**
 * Token Costs
 */
export const TOKEN_COSTS = {
  AI_CHAT: 5,
  DREAM_INTERPRETATION: 3,
  DETAILED_TAROT: 5,
  TAROT: 0,
  COFFEE_FORTUNE: 0,
  PALM_READING: 0,
  BIRTH_CHART: 0,
  SYNASTRY: 0,
} as const;

/**
 * Daily Free Limits
 */
export const DAILY_LIMITS = {
  FREE_DREAM_INTERPRETATIONS: 2,
  DAILY_FREE_TOKENS: 5,
  MAX_DAILY_STREAK_BONUS: 10,
} as const;

/**
 * XP System
 */
export const XP_REWARDS = {
  ANSWER_POSTED: 10,
  ANSWER_LIKED: 5,
  REPLY_POSTED: 3,
} as const;

export const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500] as const;
