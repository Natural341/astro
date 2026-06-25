import { AppState, AppStateStatus, Platform } from 'react-native';
import Constants from 'expo-constants';
import { getJwt } from './api';
import { tracker } from './eventTracker';

const BASE_URL = process.env.EXPO_PUBLIC_GO_BACKEND_URL;

class SessionTracker {
  private currentSessionId: string | null = null;
  private subscription: ReturnType<typeof AppState.addEventListener> | null = null;

  start() {
    this.startSession();
    this.subscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
    this.endSession();
  }

  private handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      this.startSession();
    } else if (state === 'background' || state === 'inactive') {
      // Flush events immediately on background
      tracker.flush();
      this.endSession();
    }
  };

  private async startSession() {
    if (this.currentSessionId || !BASE_URL) return;
    try {
      const token = await getJwt();
      if (!token) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`${BASE_URL}/api/v1/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform: Platform.OS,
          app_version: Constants.expoConfig?.version ?? '1.0.0',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.session_id) {
          this.currentSessionId = data.session_id;
        }
      }
    } catch {
      // Silently fail — session tracking is non-critical
    }
  }

  private async endSession() {
    if (!this.currentSessionId || !BASE_URL) return;
    const sessionId = this.currentSessionId;
    this.currentSessionId = null;

    try {
      const token = await getJwt();
      if (!token) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);

      await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      // Silently fail
    }
  }
}

export const sessionTracker = new SessionTracker();
