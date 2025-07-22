import { DEFAULT_RETRYABLE_ERRORS } from '../constants';

export type RetryStrategy = 'exponential' | 'linear' | 'jitter';

export interface RetryAttempt {
  timestamp: number;
  success: boolean;
  errorMessage?: string;
  duration: number;
}

export interface RetryConfig {
  maxRetries: number;
  timeoutMs: number;
  exponentialBackoff: boolean;
  baseDelayMs: number;
  strategy?: RetryStrategy;
  maxDelayMs?: number;
}

/**
 * Delays execution for a specified number of milliseconds
 * @param ms Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates retry delay based on strategy
 * @param retryCount Current retry attempt (1-based)
 * @param config Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  retryCount: number,
  config: RetryConfig,
): number {
  const { baseDelayMs, strategy = 'exponential', maxDelayMs = 30000 } = config;

  let delay: number;

  switch (strategy) {
    case 'exponential':
      delay = Math.pow(2, retryCount - 1) * baseDelayMs;
      break;
    case 'linear':
      delay = retryCount * baseDelayMs;
      break;
    case 'jitter':
      const exponentialDelay = Math.pow(2, retryCount - 1) * baseDelayMs;
      const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
      delay = exponentialDelay + jitter;
      break;
    default:
      delay = baseDelayMs;
  }

  return Math.min(delay, maxDelayMs);
}

/**
 * Checks if a task should be retried based on the error
 * @param error Error that occurred
 * @param retryableErrors Array of error types that should be retried
 * @returns true if the task should be retried
 */
export function shouldRetry(
  error: Error,
  retryableErrors: string[] = [],
): boolean {
  const allRetryableErrors = [...DEFAULT_RETRYABLE_ERRORS, ...retryableErrors];
  const errorMessage = error.message.toLowerCase();

  return allRetryableErrors.some((retryableError) =>
    errorMessage.includes(retryableError.toLowerCase()),
  );
}

/**
 * Creates a retry configuration from task definition
 * @param task Task definition
 * @returns RetryConfig
 */
export function createRetryConfig(task: any): RetryConfig {
  return {
    maxRetries: task.retries ?? 0,
    timeoutMs: task.timeoutMs ?? 2000,
    exponentialBackoff: true,
    baseDelayMs: 100,
    strategy: task.retryStrategy || 'exponential',
    maxDelayMs: 30000,
  };
}

/**
 * Validates retry configuration
 * @param config Retry configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateRetryConfig(config: RetryConfig): void {
  if (config.maxRetries < 0) {
    throw new Error('maxRetries must be a non-negative integer');
  }
  if (config.timeoutMs <= 0) {
    throw new Error('timeoutMs must be a positive integer');
  }
  if (config.baseDelayMs <= 0) {
    throw new Error('baseDelayMs must be a positive integer');
  }
  if (config.maxDelayMs !== undefined && config.maxDelayMs <= 0) {
    throw new Error('maxDelayMs must be a positive integer');
  }
}
