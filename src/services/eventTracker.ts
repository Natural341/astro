import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getJwt } from './api';

interface TrackEvent {
  event_type: string;
  event_data?: Record<string, any>;
  screen?: string;
  platform?: string;
  app_version?: string;
  timestamp?: string;
}

const FLUSH_INTERVAL = 30_000; // 30 seconds
const MAX_BATCH = 100;
const BASE_URL = process.env.EXPO_PUBLIC_GO_BACKEND_URL;

class EventTracker {
  private queue: TrackEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  track(type: string, data?: Record<string, any>, screen?: string) {
    this.queue.push({
      event_type: type,
      event_data: data,
      screen,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    });

    // Auto-flush if batch is full
    if (this.queue.length >= MAX_BATCH) {
      this.flush();
    }
  }

  async flush() {
    if (this.flushing || this.queue.length === 0 || !BASE_URL) return;
    this.flushing = true;

    const batch = this.queue.splice(0, MAX_BATCH);
    try {
      const token = await getJwt();
      if (!token) {
        // No auth — re-queue events
        this.queue.unshift(...batch);
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`${BASE_URL}/api/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ events: batch }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        // Re-queue on failure
        this.queue.unshift(...batch);
      }
    } catch {
      // Re-queue on network error
      this.queue.unshift(...batch);
    } finally {
      this.flushing = false;
    }
  }
}

export const tracker = new EventTracker();
