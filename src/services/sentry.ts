// Crash / error monitoring. No-op unless EXPO_PUBLIC_SENTRY_DSN is set, so it is
// safe in Expo Go and in dev. Native reporting requires a development build.
import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export const initSentry = () => {
  if (!DSN) return;
  try {
    Sentry.init({
      dsn: DSN,
      debug: false,
      tracesSampleRate: 0.2,
    });
  } catch {
    // ignore — monitoring must never crash the app
  }
};

/** Manually report a caught error. */
export const captureError = (err: unknown, context?: Record<string, any>) => {
  if (!DSN) return;
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    // ignore
  }
};
