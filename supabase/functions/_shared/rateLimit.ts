/**
 * Rate Limiting Helper
 * Tracks request counts per identifier (IP, user ID, etc.)
 * Default: 100 requests per minute
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// In-memory store: identifier -> array of timestamps
const requestLog = new Map<string, number[]>();

/**
 * Check if a request should be allowed based on rate limits
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param maxRequests - Maximum requests allowed in the time window (default: 100)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns Object with allowed status, remaining requests, and reset timestamp
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const requests = requestLog.get(identifier) || [];
  
  // Remove requests outside the current time window
  const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  // Calculate reset time (start of next window)
  const resetAt = now + windowMs;
  
  // Check if limit exceeded
  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt
    };
  }
  
  // Add current request timestamp
  recentRequests.push(now);
  requestLog.set(identifier, recentRequests);
  
  // Clean up old entries periodically (simple memory management)
  if (Math.random() < 0.01) { // 1% chance
    cleanupOldEntries(windowMs);
  }
  
  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length,
    resetAt
  };
}

/**
 * Get standard rate limit headers for HTTP responses
 * @param limit - Maximum requests allowed
 * @param remaining - Remaining requests in current window
 * @param resetAt - Timestamp when the limit resets
 * @returns Headers object
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(resetAt / 1000).toString(), // Unix timestamp in seconds
  };
}

/**
 * Clean up old entries from the request log
 * @param windowMs - Time window to keep
 */
function cleanupOldEntries(windowMs: number): void {
  const now = Date.now();
  const cutoff = now - windowMs * 2; // Keep 2x window for safety
  
  for (const [identifier, timestamps] of requestLog.entries()) {
    const recent = timestamps.filter(t => t > cutoff);
    if (recent.length === 0) {
      requestLog.delete(identifier);
    } else {
      requestLog.set(identifier, recent);
    }
  }
}

/**
 * Extract client identifier from request
 * Uses x-forwarded-for header if available, falls back to connection info
 */
export function getClientIdentifier(req: Request): string {
  // Try x-forwarded-for header first (set by proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback to a generic identifier
  return 'anonymous';
}
