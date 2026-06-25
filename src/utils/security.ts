// ============================================
// Security Utilities
// ============================================

/**
 * Safe error handler that doesn't expose sensitive information in production
 */
export const handleSecureError = (error: unknown, context: string): never => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (__DEV__) {
    // Development: Full error details
    console.error(`[${context}] Error:`, errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } else {
    // Production: Generic error message only
    console.error(`[${context}] An error occurred`);
  }

  // User-friendly error messages
  const userFriendlyMessages: Record<string, string> = {
    'Auth': 'Oturum hatasi. Lutfen tekrar giris yapin.',
    'API': 'Servis hatasi. Lutfen daha sonra tekrar deneyin.',
    'Network': 'Baglanti hatasi. Internet baglantinizi kontrol edin.',
    'Validation': 'Girdi degerleri gecersiz.',
    'Permission': 'Bu islem icin yetkiniz yok.',
    'Database': 'Veritabani hatasi. Lutfen daha sonra tekrar deneyin.',
  };

  const genericMessage = 'Bir hata olustu. Lutfen daha sonra tekrar deneyin.';

  // Return appropriate error message
  // throw new Error(userFriendlyMessages[context] || genericMessage);
  throw error as never;
};

/**
 * Check if the app is running in production environment
 */
export const isProduction = (): boolean => {
  return !__DEV__;
};

/**
 * Log security events (in production, this should send to monitoring service)
 */
export const logSecurityEvent = (
  event: string,
  details?: Record<string, unknown>
): void => {
  if (__DEV__) {
    console.log(`[Security Event] ${event}`, details || '');
  } else {
    // In production, send to monitoring/analytics service
    // Example: Sentry, LogRocket, etc.
    console.warn(`[Security Event] ${event}`);
  }
};

/**
 * Sanitize user input for XSS prevention
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';

  let sanitized = input.trim();

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove potentially dangerous patterns
  const dangerousPatterns = [
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:[^;]*;base64/gi,
    /vbscript:/gi,
    /&lt;/gi,
    /&gt;/gi,
    /&amp;/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Turkish format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+90|0)?5\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis or similar
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old timestamps
    this.timestamps = this.timestamps.filter(ts => ts > windowStart);

    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const recentRequests = this.timestamps.filter(ts => ts > windowStart);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  reset(): void {
    this.timestamps = [];
  }
}

/**
 * Constants for rate limiting different operations
 */
export const RateLimits = {
  AI_CHAT: new RateLimiter(30, 60000), // 30 requests per minute
  API_CALL: new RateLimiter(100, 60000), // 100 requests per minute
  AUTH_ATTEMPT: new RateLimiter(5, 300000), // 5 attempts per 5 minutes
  SUBMIT_FORM: new RateLimiter(10, 60000), // 10 submissions per minute
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (
  data: string,
  showFirst: number = 4,
  showLast: number = 4
): string => {
  if (data.length <= showFirst + showLast) {
    return '*'.repeat(data.length);
  }
  return `${data.substring(0, showFirst)}${'*'.repeat(data.length - showFirst - showLast)}${data.substring(data.length - showLast)}`;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe JSON parser that doesn't throw
 */
export const safeJsonParse = <T = unknown>(
  json: string,
  fallback: T
): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Deep clone object to prevent reference issues
 */
export const deepClone = <T>(obj: T): T => {
  return safeJsonParse<T>(JSON.stringify(obj), obj);
};
