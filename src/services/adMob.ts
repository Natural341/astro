// AdMob Service — banner + rewarded ad units, dev-safe test ID fallback
import { Platform } from 'react-native';
import mobileAds, {
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { AppConfig } from '../config/appConfig';
import { handleSecureError } from '../utils/security';

let adsInitialized = false;

/**
 * Initialize the Google Mobile Ads SDK. Safe to call multiple times.
 */
export const initializeAdMob = async (): Promise<void> => {
  if (adsInitialized) return;
  try {
    await mobileAds().initialize();
    adsInitialized = true;
    if (__DEV__) console.log('[AdMob] Initialized successfully');
  } catch (error) {
    handleSecureError(error, 'AdMob');
  }
};

const hasRealUnitId = (id: string | undefined): id is string =>
  !!id && !id.startsWith('your_') && !id.startsWith('YOUR_');

/**
 * Banner ad unit ID for this platform. Falls back to Google's public test
 * unit ID in dev when no real ID is configured; returns null in production
 * so callers can skip rendering the banner entirely rather than crash.
 */
export const getBannerAdUnitId = (): string | null => {
  const id = Platform.OS === 'ios' ? AppConfig.admobBannerIos : AppConfig.admobBannerAndroid;
  if (hasRealUnitId(id)) return id;
  return __DEV__ ? TestIds.BANNER : null;
};

const getRewardedAdUnitId = (): string | null => {
  const id = Platform.OS === 'ios' ? AppConfig.admobRewardVideoIos : AppConfig.admobRewardVideoAndroid;
  if (hasRealUnitId(id)) return id;
  return __DEV__ ? TestIds.REWARDED : null;
};

export { BannerAdSize };

/**
 * Load and show a rewarded ad. Resolves true only if the user watched it to
 * completion and earned the reward (server-side token crediting still needs
 * to happen separately via claimAdReward() — this function only reports
 * whether the ad was actually watched).
 */
export const showRewardedAd = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const unitId = getRewardedAdUnitId();
    if (!unitId) {
      resolve(false);
      return;
    }

    const rewarded = RewardedAd.createForAdRequest(unitId);
    let earned = false;
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
      resolve(result);
    };

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewarded.show();
    });
    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      finish(earned);
    });
    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      handleSecureError(error, 'AdMob');
      finish(false);
    });

    rewarded.load();
  });
};
