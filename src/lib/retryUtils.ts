/**
 * Retry utility with exponential backoff
 * Used for critical database operations that MUST succeed
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry on failure
 * Uses exponential backoff: 500ms -> 1s -> 2s -> 4s -> 8s
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error = new Error('Unknown error');
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxRetries) {
        console.error(`[withRetry] All ${opts.maxRetries} attempts failed:`, lastError);
        throw lastError;
      }

      console.warn(`[withRetry] Attempt ${attempt}/${opts.maxRetries} failed:`, lastError.message);
      opts.onRetry(attempt, lastError);

      // Wait before retrying
      await sleep(delay);

      // Exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Retry a Supabase database operation
 * Specifically handles Supabase errors and connection issues
 */
export async function retrySupabaseUpdate<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const opts = {
    maxRetries: 5,
    initialDelayMs: 500,
    ...options,
  };

  let lastResult: { data: T | null; error: any } = { data: null, error: null };

  for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
    lastResult = await operation();

    if (!lastResult.error) {
      if (attempt > 1) {
        console.log(`[retrySupabaseUpdate] Succeeded on attempt ${attempt}`);
      }
      return lastResult;
    }

    // Check if error is retryable
    const errorMessage = lastResult.error?.message || '';
    const isRetryable =
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('network') ||
      errorMessage.includes('503') ||
      errorMessage.includes('502') ||
      errorMessage.includes('504');

    if (!isRetryable && attempt === 1) {
      // Non-retryable error on first attempt, fail immediately
      console.error('[retrySupabaseUpdate] Non-retryable error:', lastResult.error);
      return lastResult;
    }

    if (attempt < opts.maxRetries!) {
      console.warn(`[retrySupabaseUpdate] Attempt ${attempt} failed, retrying...`, lastResult.error);
      await sleep(opts.initialDelayMs! * Math.pow(2, attempt - 1));
    }
  }

  console.error(`[retrySupabaseUpdate] All ${opts.maxRetries} attempts failed`);
  return lastResult;
}
