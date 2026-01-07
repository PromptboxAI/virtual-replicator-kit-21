/**
 * Database-backed rate limiter for Supabase Edge Functions
 * Persists across cold starts and works across multiple instances
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

// Default configs per endpoint
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'trading-engine-v7': { maxRequests: 50, windowSeconds: 60 },
  'trading-engine-v6': { maxRequests: 50, windowSeconds: 60 },
  'execute-trade': { maxRequests: 30, windowSeconds: 60 },
  'execute-bonding-curve-trade-v4': { maxRequests: 30, windowSeconds: 60 },
  'claim-rewards': { maxRequests: 10, windowSeconds: 60 },  // Lower - financial
  'get-quote': { maxRequests: 100, windowSeconds: 60 },
  'get-dex-quote': { maxRequests: 60, windowSeconds: 60 },
  'get-ohlc': { maxRequests: 100, windowSeconds: 60 },
  'get-token-metadata': { maxRequests: 100, windowSeconds: 60 },
  'default': { maxRequests: 100, windowSeconds: 60 }
};

/**
 * Get rate limit config for an endpoint
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS['default'];
}

/**
 * Extract client identifier from request
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'anonymous';
}

/**
 * Check rate limit using database RPC (persistent across instances)
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  endpoint: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds
    });

    if (error) {
      console.error(`[rateLimitV2] RPC error: ${error.message}`);
      // Fail open - allow request if rate limiting fails
      return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      resetAt: data.resetAt
    };
  } catch (err) {
    console.error(`[rateLimitV2] Exception: ${err}`);
    // Fail open
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

/**
 * Get standard rate limit headers
 */
export function getRateLimitHeaders(limit: number, remaining: number, resetAt: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString()
  };
}

/**
 * Create a standardized rate limit exceeded response
 */
export function rateLimitExceededResponse(
  rateCheck: RateLimitResult,
  corsHeaders: Record<string, string>,
  limit: number = 50
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Rate limit exceeded. Please wait before making more requests.',
      retryAfter: Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        ...getRateLimitHeaders(limit, rateCheck.remaining, rateCheck.resetAt),
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((rateCheck.resetAt - Date.now()) / 1000).toString()
      }
    }
  );
}
