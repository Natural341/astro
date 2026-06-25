// Local notifications setup. Importing this module installs the foreground
// handler (without it, scheduled notifications never appear while the app is open).
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;
const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  channelReady = true;
};

/** Call once on app start (creates the Android channel). */
export const initNotifications = async () => {
  await ensureAndroidChannel();
};

/** Ask for permission (and create the channel). Returns true if granted. */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
};

/**
 * Register this device for remote push and return its Expo push token.
 * Returns null on a simulator, when permission is denied, or when the EAS
 * projectId is not configured yet (best-effort — never throws).
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!Device.isDevice) return null; // push tokens are not issued on simulators

  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  if (!projectId || projectId === 'your-project-id') {
    if (__DEV__) console.warn('[notifications] EAS projectId not set — skipping push token.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (e) {
    if (__DEV__) console.warn('[notifications] getExpoPushTokenAsync failed:', (e as Error).message);
    return null;
  }
};

export interface NotificationRoute {
  screen: string;
  params?: Record<string, any>;
}

/**
 * Map a notification's `data` payload to an in-app route. The backend can send an
 * explicit `{ screen, params }`, otherwise we fall back to a type-based mapping.
 */
export const notificationDataToRoute = (data: any): NotificationRoute | null => {
  if (!data) return null;
  if (typeof data.screen === 'string') {
    return { screen: data.screen, params: data.params };
  }
  switch (data.type) {
    case 'message':
    case 'new_message':
      return data.astrologerId
        ? { screen: 'AstrologerChat', params: { astrologerId: data.astrologerId } }
        : { screen: 'Messages' };
    case 'premium':
      return { screen: 'Premium' };
    case 'streak':
      return { screen: 'Main' };
    default:
      return { screen: 'Notifications' };
  }
};
