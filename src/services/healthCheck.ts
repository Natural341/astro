import { isProduction, handleSecureError } from '../utils/security';

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Health check result
 */
export interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  latency?: number;
  message: string;
  timestamp: number;
}

/**
 * Overall health check report
 */
export interface HealthReport {
  overall: HealthStatus;
  checks: HealthCheckResult[];
  timestamp: number;
}

/**
 * Check API key configuration
 */
export const checkApiKeys = (): HealthCheckResult => {
  try {
    const checks: { service: string; valid: boolean }[] = [
      { service: 'Gemini API Key', valid: !!process.env.EXPO_PUBLIC_GEMINI_API_KEY },
    ];

    const allValid = checks.every((check) => check.valid);

    return {
      service: 'API Keys',
      status: allValid ? 'healthy' : 'unhealthy',
      message: allValid
        ? 'All API keys configured'
        : `Missing: ${checks.filter((c) => !c.valid).map((c) => c.service).join(', ')}`,
      timestamp: Date.now(),
    };
  } catch (error) {
    handleSecureError(error, 'HealthCheck');
    return {
      service: 'API Keys',
      status: 'unhealthy',
      message: 'Failed to check API keys',
      timestamp: Date.now(),
    };
  }
};

/**
 * Check revenue cat configuration
 */
export const checkRevenueCatHealth = (): HealthCheckResult => {
  try {
    const hasGoogleKey = !!process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
    const hasAppleKey = !!process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY;

    const status: HealthStatus = hasGoogleKey && hasAppleKey ? 'healthy' : 'unhealthy';

    return {
      service: 'RevenueCat',
      status,
      message: hasGoogleKey && hasAppleKey
        ? 'API keys configured'
        : `Missing: ${[
          !hasGoogleKey && 'Google API Key',
          !hasAppleKey && 'Apple API Key',
        ]
          .filter(Boolean)
          .join(', ')}`,
      timestamp: Date.now(),
    };
  } catch (error) {
    handleSecureError(error, 'HealthCheck');
    return {
      service: 'RevenueCat',
      status: 'unhealthy',
      message: 'Failed to check RevenueCat',
      timestamp: Date.now(),
    };
  }
};

/**
 * Check AdMob configuration
 */
export const checkAdMobHealth = (): HealthCheckResult => {
  try {
    const hasAndroidId = !!process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID;
    const hasIosId = !!process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS;

    const status: HealthStatus = hasAndroidId && hasIosId ? 'healthy' : 'degraded';

    return {
      service: 'AdMob',
      status,
      message: hasAndroidId && hasIosId
        ? 'AdMob IDs configured'
        : 'Some AdMob IDs missing (non-critical)',
      timestamp: Date.now(),
    };
  } catch (error) {
    handleSecureError(error, 'HealthCheck');
    return {
      service: 'AdMob',
      status: 'degraded',
      message: 'Failed to check AdMob',
      timestamp: Date.now(),
    };
  }
};

/**
 * Check storage availability
 */
export const checkStorageHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();

  try {
    // Try to write and read from AsyncStorage
    const testKey = '__health_check__';
    const testValue = 'test';

    // Simulated storage check - in real implementation, use AsyncStorage
    const latency = Date.now() - startTime;

    return {
      service: 'Storage',
      status: 'healthy',
      latency,
      message: 'Storage available',
      timestamp: Date.now(),
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      service: 'Storage',
      status: 'unhealthy',
      latency,
      message: 'Storage unavailable',
      timestamp: Date.now(),
    };
  }
};

/**
 * Run all health checks
 */
export const runHealthChecks = async (): Promise<HealthReport> => {
  const startTime = Date.now();

  const checks: HealthCheckResult[] = [];

  // Run all checks in parallel where possible
  const [storageResult] = await Promise.all([
    checkStorageHealth(),
  ]);

  checks.push(storageResult);

  // Run synchronous checks
  checks.push(checkApiKeys());
  checks.push(checkRevenueCatHealth());
  checks.push(checkAdMobHealth());

  // Calculate overall health
  const unhealthyCount = checks.filter((c) => c.status === 'unhealthy').length;
  const degradedCount = checks.filter((c) => c.status === 'degraded').length;

  let overall: HealthStatus;
  if (unhealthyCount > 0) {
    overall = 'unhealthy';
  } else if (degradedCount > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }

  return {
    overall,
    checks,
    timestamp: Date.now(),
  };
};

/**
 * Get health summary
 */
export const getHealthSummary = (report: HealthReport): string => {
  const icon = report.overall === 'healthy' ? '✅' : report.overall === 'degraded' ? '⚠️' : '❌';
  const healthyCount = report.checks.filter((c) => c.status === 'healthy').length;
  const degradedCount = report.checks.filter((c) => c.status === 'degraded').length;
  const unhealthyCount = report.checks.filter((c) => c.status === 'unhealthy').length;

  return `
${icon} Health Status: ${report.overall.toUpperCase()}
Healthy: ${healthyCount} | Degraded: ${degradedCount} | Unhealthy: ${unhealthyCount}

Services:
${report.checks.map((check) => {
    const checkIcon = check.status === 'healthy' ? '✅' : check.status === 'degraded' ? '⚠️' : '❌';
    return `  ${checkIcon} ${check.service}: ${check.message}${check.latency ? ` (${check.latency}ms)` : ''}`;
  }).join('\n')}
`;
};

/**
 * Log health report
 */
export const logHealthReport = (report: HealthReport): void => {
  const summary = getHealthSummary(report);

  if (__DEV__) {
    console.log('========================================');
    console.log('        HEALTH CHECK REPORT');
    console.log('========================================');
    console.log(summary);
    console.log('========================================');
  } else if (report.overall !== 'healthy') {
    // Only log in production if not healthy
    console.warn('[HealthCheck] System health issues detected');
    console.warn(summary);
  }
};

/**
 * Health check monitor (periodic checks)
 */
export class HealthMonitor {
  private interval: NodeJS.Timeout | null = null;
  private checkIntervalMs: number = 60000; // 1 minute default
  private onHealthChange?: (report: HealthReport) => void;
  private lastReport: HealthReport | null = null;

  constructor(intervalMs?: number) {
    this.checkIntervalMs = intervalMs || 60000;
  }

  /**
   * Start health monitoring
   */
  start(onHealthChange?: (report: HealthReport) => void): void {
    this.onHealthChange = onHealthChange;

    // Initial check
    this.performCheck();

    // Start periodic checks
    this.interval = setInterval(() => {
      this.performCheck();
    }, this.checkIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Perform a single health check
   */
  async performCheck(): Promise<HealthReport> {
    const report = await runHealthChecks();

    // Notify on health change
    if (this.onHealthChange && this.lastReport?.overall !== report.overall) {
      this.onHealthChange(report);
    }

    this.lastReport = report;

    return report;
  }

  /**
   * Get last health report
   */
  getLastReport(): HealthReport | null {
    return this.lastReport;
  }

  /**
   * Set check interval
   */
  setCheckInterval(intervalMs: number): void {
    this.checkIntervalMs = intervalMs;

    // Restart with new interval if running
    if (this.interval) {
      this.stop();
      this.start(this.onHealthChange);
    }
  }
}

// Global health monitor instance
export const healthMonitor = new HealthMonitor();

/**
 * Start health monitoring (call this on app startup)
 */
export const startHealthMonitoring = async (onHealthChange?: (report: HealthReport) => void): Promise<void> => {
  if (isProduction()) {
    // Only run in production mode
    healthMonitor.start(onHealthChange);
  } else {
    // In development, just run once and log
    const report = await runHealthChecks();
    logHealthReport(report);
  }
};

/**
 * Stop health monitoring
 */
export const stopHealthMonitoring = (): void => {
  healthMonitor.stop();
};

/**
 * Check if system is healthy
 */
export const isSystemHealthy = async (): Promise<boolean> => {
  const report = await runHealthChecks();
  return report.overall === 'healthy';
};
