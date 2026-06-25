import Constants from 'expo-constants';

// Environment validation helper
const validateEnv = () => {
  const optional: Record<string, string | undefined> = {
    EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    EXPO_PUBLIC_GO_BACKEND_URL: process.env.EXPO_PUBLIC_GO_BACKEND_URL,
  };

  const missing = Object.entries(optional)
    .filter(([, value]) => !value || value.startsWith('your_') || value.startsWith('YOUR_'))
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(`Missing or invalid environment variables: ${missing.join(', ')}`);
  }

  return optional;
};

// Validate on import
const envVars = validateEnv();

export const AppConfig = {
  // ============ RevenueCat ============
  revenueCatGoogleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY,
  revenueCatAppleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
  premiumEntitlementId: 'premium',

  // ============ Gemini AI ============
  geminiApiKey: envVars.EXPO_PUBLIC_GEMINI_API_KEY,

  // ============ Go Backend ============
  goBackendUrl: (() => {
    const url = envVars.EXPO_PUBLIC_GO_BACKEND_URL;
    if (url) return url;
    if (__DEV__) return 'http://localhost:8080';
    throw new Error('EXPO_PUBLIC_GO_BACKEND_URL is not set');
  })(),

  // ============ AdMob ============
  admobAppIdAndroid: process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID,
  admobAppIdIos: process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS,
  admobBannerAndroid: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
  admobBannerIos: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
  admobRewardVideoAndroid: process.env.EXPO_PUBLIC_ADMOB_REWARD_VIDEO_ANDROID,
  admobRewardVideoIos: process.env.EXPO_PUBLIC_ADMOB_REWARD_VIDEO_IOS,

  // ============ Token Ayarlari ============
  tokenDisplayName: 'Altin',
  defaultTokens: 30,
  streakMinReward: 10,
  streakMaxReward: 15,
  extraAdReward: 5,
  maxDailyAds: 5,
  premiumDailyBonus: 10,

  // Token Maliyetleri
  tokenCostAIChat: 10,
  tokenCostDreamInterpretation: 10,
  tokenCostDetailedTarot: 10,
  tokenCostTarot: 0,
  tokenCostCoffeeFortune: 0,
  tokenCostPalmReading: 0,
  tokenCostBirthChart: 0,
  tokenCostSynastry: 0,

  // Gunluk Ucretsiz Haklar
  freeDreamInterpretations: 2,
  dailyFreeTokens: 5,
  maxDailyStreakBonus: 10,

  // ============ Uygulama Ayarlari ============
  appName: 'Kosmos Astro',
  appVersion: '1.0.0',
  supportEmail: 'support@kosmosastro.app',
  privacyPolicyUrl: 'https://kosmosastro.app/privacy',
  termsOfServiceUrl: 'https://kosmosastro.app/terms',

};
