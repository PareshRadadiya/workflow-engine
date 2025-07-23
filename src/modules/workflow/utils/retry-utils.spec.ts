import {
  delay,
  calculateRetryDelay,
  shouldRetry,
  createRetryConfig,
  validateRetryConfig,
} from './retry-utils';

import { RetryConfig, RetryStrategy } from '../interfaces/retry.interface';

describe('RetryUtils', () => {
  describe('delay', () => {
    it('should delay execution for specified milliseconds', async () => {
      const startTime = Date.now();
      await delay(100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    });
  });

  describe('calculateRetryDelay', () => {
    const baseConfig: RetryConfig = {
      maxRetries: 3,
      timeoutMs: 1000,
      exponentialBackoff: true,
      baseDelayMs: 100,
    };

    it('should calculate exponential delay correctly', () => {
      const config = {
        ...baseConfig,
        strategy: 'exponential' as RetryStrategy,
      };

      expect(calculateRetryDelay(1, config)).toBe(100); // 2^0 * 100
      expect(calculateRetryDelay(2, config)).toBe(200); // 2^1 * 100
      expect(calculateRetryDelay(3, config)).toBe(400); // 2^2 * 100
    });

    it('should calculate linear delay correctly', () => {
      const config = { ...baseConfig, strategy: 'linear' as RetryStrategy };

      expect(calculateRetryDelay(1, config)).toBe(100); // 1 * 100
      expect(calculateRetryDelay(2, config)).toBe(200); // 2 * 100
      expect(calculateRetryDelay(3, config)).toBe(300); // 3 * 100
    });

    it('should calculate jitter delay correctly', () => {
      const config = { ...baseConfig, strategy: 'jitter' as RetryStrategy };

      const delay1 = calculateRetryDelay(1, config);
      const delay2 = calculateRetryDelay(2, config);
      const delay3 = calculateRetryDelay(3, config);

      // Should be exponential base with some jitter
      expect(delay1).toBeGreaterThanOrEqual(100);
      expect(delay1).toBeLessThanOrEqual(110); // 10% jitter
      expect(delay2).toBeGreaterThanOrEqual(200);
      expect(delay2).toBeLessThanOrEqual(220);
      expect(delay3).toBeGreaterThanOrEqual(400);
      expect(delay3).toBeLessThanOrEqual(440);
    });

    it('should respect maxDelayMs', () => {
      const config = {
        ...baseConfig,
        strategy: 'exponential' as RetryStrategy,
        maxDelayMs: 150,
      };

      expect(calculateRetryDelay(1, config)).toBe(100);
      expect(calculateRetryDelay(2, config)).toBe(150); // Capped at maxDelayMs
      expect(calculateRetryDelay(3, config)).toBe(150); // Capped at maxDelayMs
    });

    it('should default to exponential strategy', () => {
      const config = { ...baseConfig, strategy: undefined };

      expect(calculateRetryDelay(1, config)).toBe(100);
      expect(calculateRetryDelay(2, config)).toBe(200);
    });
  });

  describe('shouldRetry', () => {
    it('should retry default retryable errors', () => {
      expect(shouldRetry(new Error('timeout error'))).toBe(true);
      expect(shouldRetry(new Error('network error'))).toBe(true);
      expect(shouldRetry(new Error('connection failed'))).toBe(true);
      expect(shouldRetry(new Error('rate limit exceeded'))).toBe(true);
    });

    it('should retry custom retryable errors', () => {
      const customErrors = ['custom error', 'specific failure'];

      expect(
        shouldRetry(new Error('custom error occurred'), customErrors),
      ).toBe(true);
      expect(
        shouldRetry(new Error('specific failure happened'), customErrors),
      ).toBe(true);
    });

    it('should not retry non-retryable errors', () => {
      expect(shouldRetry(new Error('permission denied'))).toBe(false);
      expect(shouldRetry(new Error('invalid input'))).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(shouldRetry(new Error('TIMEOUT ERROR'))).toBe(true);
      expect(shouldRetry(new Error('Network Error'))).toBe(true);
    });
  });

  describe('createRetryConfig', () => {
    it('should create config with default values', () => {
      const task = { id: 'test' };
      const config = createRetryConfig(task);

      expect(config.maxRetries).toBe(0);
      expect(config.timeoutMs).toBe(2000);
      expect(config.exponentialBackoff).toBe(true);
      expect(config.baseDelayMs).toBe(100);
      expect(config.strategy).toBe('exponential');
      expect(config.maxDelayMs).toBe(30000);
    });

    it('should use task-specific values', () => {
      const task = {
        id: 'test',
        retries: 3,
        timeoutMs: 5000,
        retryStrategy: 'linear' as RetryStrategy,
      };
      const config = createRetryConfig(task);

      expect(config.maxRetries).toBe(3);
      expect(config.timeoutMs).toBe(5000);
      expect(config.strategy).toBe('linear');
    });
  });

  describe('validateRetryConfig', () => {
    it('should validate correct config', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        timeoutMs: 1000,
        exponentialBackoff: true,
        baseDelayMs: 100,
        maxDelayMs: 5000,
      };

      expect(() => validateRetryConfig(config)).not.toThrow();
    });

    it('should throw error for negative maxRetries', () => {
      const config: RetryConfig = {
        maxRetries: -1,
        timeoutMs: 1000,
        exponentialBackoff: true,
        baseDelayMs: 100,
      };

      expect(() => validateRetryConfig(config)).toThrow(
        'maxRetries must be a non-negative integer',
      );
    });

    it('should throw error for non-positive timeoutMs', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        timeoutMs: 0,
        exponentialBackoff: true,
        baseDelayMs: 100,
      };

      expect(() => validateRetryConfig(config)).toThrow(
        'timeoutMs must be a positive integer',
      );
    });

    it('should throw error for non-positive baseDelayMs', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        timeoutMs: 1000,
        exponentialBackoff: true,
        baseDelayMs: 0,
      };

      expect(() => validateRetryConfig(config)).toThrow(
        'baseDelayMs must be a positive integer',
      );
    });

    it('should throw error for non-positive maxDelayMs', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        timeoutMs: 1000,
        exponentialBackoff: true,
        baseDelayMs: 100,
        maxDelayMs: 0,
      };

      expect(() => validateRetryConfig(config)).toThrow(
        'maxDelayMs must be a positive integer',
      );
    });
  });
});
