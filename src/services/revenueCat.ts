// RevenueCat Service
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { AppConfig } from '../config/appConfig';
import { handleSecureError } from '../utils/security';

// Get platform-specific API key. Returns null if not configured for this platform.
const getApiKey = (): string | null => {
  const androidKey = AppConfig.revenueCatGoogleApiKey;
  const iosKey = AppConfig.revenueCatAppleApiKey;
  const key = Platform.OS === 'ios' ? iosKey : androidKey;

  if (!key || key.startsWith('your_') || key.startsWith('YOUR_')) {
    if (__DEV__) {
      console.warn('[RevenueCat] API key not configured for this platform — using test key (dev only).');
      return 'test_aBAyqdxlbeRruIgflrxWoYzrfTh';
    }
    return null;
  }
  return key;
};

let revenueCatReady = false;

/**
 * Initialize RevenueCat SDK. In production, if the platform API key isn't
 * configured, purchases stay disabled instead of silently running against
 * RevenueCat's shared public test key (which cannot process real payments).
 */
export const initializeRevenueCat = async (): Promise<void> => {
  try {
    const logLevel = __DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR;
    Purchases.setLogLevel(logLevel);

    const apiKey = getApiKey();
    if (!apiKey) {
      if (__DEV__) console.warn('[RevenueCat] Not initialized — missing production API key.');
      return;
    }

    await Purchases.configure({
      apiKey,
      appUserID: undefined, // Let RevenueCat handle user IDs
    });
    revenueCatReady = true;

    if (__DEV__) {
      console.log('[RevenueCat] Initialized successfully');
    }
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
  }
};

/** Whether RevenueCat was successfully configured with a real API key. */
export const isRevenueCatReady = (): boolean => revenueCatReady;

/**
 * Check if user has premium entitlement
 */
export const isPremiumUser = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();

    // Check for active premium entitlement
    const isPremium = typeof customerInfo.entitlements.active[AppConfig.premiumEntitlementId] !== 'undefined';

    if (__DEV__) {
      console.log('[RevenueCat] Premium status:', isPremium);
    }

    return isPremium;
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
    return false;
  }
};

/**
 * Get customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
    return null;
  }
};

/**
 * Get available offerings
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;

    if (!currentOffering) {
      if (__DEV__) console.warn('[RevenueCat] No current offering found');
      return null;
    }

    return currentOffering;
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
    return null;
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<boolean> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    const isPremium = typeof customerInfo.entitlements.active[AppConfig.premiumEntitlementId] !== 'undefined';

    if (__DEV__) {
      console.log('[RevenueCat] Purchase successful. Premium:', isPremium);
    }

    return isPremium;
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
    return false;
  }
};

/**
 * Purchase a consumable package (e.g. a token pack) — unlike purchasePackage(),
 * this does not check for the premium entitlement (consumables don't grant one).
 * Returns the resulting CustomerInfo on success, or null on cancel/error.
 */
export const purchaseConsumablePackage = async (
  packageToPurchase: PurchasesPackage,
): Promise<CustomerInfo | null> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    if (__DEV__) {
      console.log('[RevenueCat] Consumable purchase successful');
    }
    return customerInfo;
  } catch (error: any) {
    if (error?.userCancelled) {
      return null;
    }
    handleSecureError(error, 'RevenueCat');
    return null;
  }
};

/**
 * Present paywall and handle result
 */
export const presentPaywall = async (): Promise<boolean> => {
  try {
    const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

    switch (paywallResult) {
      case PAYWALL_RESULT.NOT_PRESENTED:
        if (__DEV__) console.log('[RevenueCat] Paywall not presented');
        return false;
      case PAYWALL_RESULT.ERROR:
        if (__DEV__) console.error('[RevenueCat] Paywall error');
        return false;
      case PAYWALL_RESULT.CANCELLED:
        if (__DEV__) console.log('[RevenueCat] Paywall cancelled');
        return false;
      case PAYWALL_RESULT.PURCHASED:
        if (__DEV__) console.log('[RevenueCat] Purchase successful');
        return true;
      case PAYWALL_RESULT.RESTORED:
        if (__DEV__) console.log('[RevenueCat] Purchases restored');
        return true;
      default:
        return false;
    }
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
    return false;
  }
};

/**
 * Present paywall without forcing close after purchase
 */
export const presentPaywallIfNeeded = async (forcePaywall: boolean = false): Promise<boolean> => {
  try {
    const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: AppConfig.premiumEntitlementId,
    });

    switch (paywallResult) {
      case PAYWALL_RESULT.NOT_PRESENTED:
        return false;
      case PAYWALL_RESULT.ERROR:
        return false;
      case PAYWALL_RESULT.CANCELLED:
        return false;
      case PAYWALL_RESULT.PURCHASED:
        return true;
      case PAYWALL_RESULT.RESTORED:
        return true;
      default:
        return false;
    }
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
    return false;
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = typeof customerInfo.entitlements.active[AppConfig.premiumEntitlementId] !== 'undefined';

    if (__DEV__) {
      console.log('[RevenueCat] Restore completed. Premium:', isPremium);
    }

    return isPremium;
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
    return false;
  }
};

/**
 * Set a custom user ID
 * Call this after user authentication
 */
export const setUserID = async (userID: string): Promise<void> => {
  try {
    if (!userID || userID.length === 0) {
      throw new Error('User ID cannot be empty');
    }

    await Purchases.logIn(userID);

    if (__DEV__) {
      console.log('[RevenueCat] User logged in:', userID);
    }
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
  }
};

/**
 * Log out user
 */
export const logOut = async (): Promise<void> => {
  try {
    await Purchases.logOut();

    if (__DEV__) {
      console.log('[RevenueCat] User logged out');
    }
  } catch (error) {
    handleSecureError(error, 'RevenueCat');
  }
};

/**
 * Get entitlement ID from config
 */
export const getPremiumEntitlementId = (): string => {
  return AppConfig.premiumEntitlementId;
};
