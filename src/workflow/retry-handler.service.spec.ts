import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RetryHandlerService } from './retry-handler.service';
import { TaskDefinition } from './task.interface';
import { WorkflowEvent } from './events.enum';
import {
  calculateRetryDelay,
  shouldRetry,
  createRetryConfig,
  validateRetryConfig,
  RetryConfig,
} from './utils/retry-utils';

describe('RetryHandlerService', () => {
  let service: RetryHandlerService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryHandlerService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RetryHandlerService>(RetryHandlerService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeWithRetry', () => {
    it('should execute task successfully on first attempt', async () => {
      const task: TaskDefinition = {
        id: 'successfulTask',
        handler: async () => 'success',
        retries: 2,
        timeoutMs: 1000,
      };

      const context = {
        taskId: 'successfulTask',
        startTime: Date.now(),
        retryCount: 0,
        maxRetries: 2,
        timeoutMs: 1000,
      };

      const result = await service.executeWithRetry(task, context);

      expect(result.success).toBe(true);
      expect(result.result?.data).toBe('success');
      expect(result.retryCount).toBe(0);
      expect(result.result?.success).toBe(true);
    });

    it('should retry failed task and succeed', async () => {
      let attemptCount = 0;
      const task: TaskDefinition = {
        id: 'retryTask',
        handler: async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Task failed');
          }
          return 'success after retries';
        },
        retries: 2,
        timeoutMs: 1000,
        retryableErrors: ['Task failed'],
      };

      const context = {
        taskId: 'retryTask',
        startTime: Date.now(),
        retryCount: 0,
        maxRetries: 2,
        timeoutMs: 1000,
      };

      const result = await service.executeWithRetry(task, context);

      expect(result.success).toBe(true);
      expect(result.result?.data).toBe('success after retries');
      expect(result.retryCount).toBe(2);
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      const task: TaskDefinition = {
        id: 'failingTask',
        handler: async () => {
          throw new Error('Task always fails');
        },
        retries: 1,
        timeoutMs: 1000,
        retryableErrors: ['Task always fails'],
      };

      const context = {
        taskId: 'failingTask',
        startTime: Date.now(),
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 1000,
      };

      const result = await service.executeWithRetry(task, context);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Task always fails');
      expect(result.retryCount).toBe(1);
      expect(result.result?.success).toBe(false);
    });

    it('should timeout task', async () => {
      const task: TaskDefinition = {
        id: 'slowTask',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return 'should not reach here';
        },
        retries: 0,
        timeoutMs: 100,
      };

      const context = {
        taskId: 'slowTask',
        startTime: Date.now(),
        retryCount: 0,
        maxRetries: 0,
        timeoutMs: 100,
      };

      const result = await service.executeWithRetry(task, context);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timed out');
      expect(result.retryCount).toBe(0);
    });

    it('should emit retry events', async () => {
      let attemptCount = 0;
      const task: TaskDefinition = {
        id: 'retryEventTask',
        handler: async () => {
          attemptCount++;
          if (attemptCount < 2) {
            throw new Error('Task failed');
          }
          return 'success';
        },
        retries: 1,
        timeoutMs: 1000,
        retryableErrors: ['Task failed'],
      };

      const context = {
        taskId: 'retryEventTask',
        startTime: Date.now(),
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 1000,
      };

      await service.executeWithRetry(task, context);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.TASK_RETRY,
        expect.any(Object),
      );
    });

    it('should emit failure events', async () => {
      const task: TaskDefinition = {
        id: 'failureEventTask',
        handler: async () => {
          throw new Error('Task always fails');
        },
        retries: 0,
        timeoutMs: 1000,
      };

      const context = {
        taskId: 'failureEventTask',
        startTime: Date.now(),
        retryCount: 0,
        maxRetries: 0,
        timeoutMs: 1000,
      };

      await service.executeWithRetry(task, context);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.TASK_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        timeoutMs: 1000,
        exponentialBackoff: true,
        baseDelayMs: 100,
        strategy: 'exponential',
      };
      expect(calculateRetryDelay(1, config)).toBe(100);
      expect(calculateRetryDelay(2, config)).toBe(200);
      expect(calculateRetryDelay(3, config)).toBe(400);
      expect(calculateRetryDelay(4, config)).toBe(800);
    });

    it('should respect maximum delay', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        timeoutMs: 1000,
        exponentialBackoff: true,
        baseDelayMs: 100,
        strategy: 'exponential',
        maxDelayMs: 500,
      };
      const delay = calculateRetryDelay(10, config);
      expect(delay).toBe(500); // Should be capped at maxDelayMs
    });

    it('should use default values', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        timeoutMs: 1000,
        exponentialBackoff: true,
        baseDelayMs: 100,
        strategy: 'exponential',
      };
      expect(calculateRetryDelay(1, config)).toBe(100);
      expect(calculateRetryDelay(2, config)).toBe(200);
    });
  });

  describe('shouldRetry', () => {
    it('should retry timeout errors', () => {
      const error = new Error('Task timed out after 1000ms');
      expect(shouldRetry(error)).toBe(true);
    });

    it('should retry network errors', () => {
      const error = new Error('Network connection failed');
      expect(shouldRetry(error)).toBe(true);
    });

    it('should retry rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      expect(shouldRetry(error)).toBe(true);
    });

    it('should not retry validation errors', () => {
      const error = new Error('Invalid input data');
      expect(shouldRetry(error)).toBe(false);
    });

    it('should retry custom retryable errors', () => {
      const error = new Error('Custom retryable error');
      const retryableErrors = ['custom retryable'];
      expect(shouldRetry(error, retryableErrors)).toBe(true);
    });

    it('should be case insensitive', () => {
      const error = new Error('NETWORK CONNECTION FAILED');
      expect(shouldRetry(error)).toBe(true);
    });
  });

  describe('createRetryConfig', () => {
    it('should create config from task definition', () => {
      const task: TaskDefinition = {
        id: 'testTask',
        handler: async () => 'test',
        retries: 3,
        timeoutMs: 5000,
      };

      const config = createRetryConfig(task);

      expect(config.maxRetries).toBe(3);
      expect(config.timeoutMs).toBe(5000);
      expect(config.exponentialBackoff).toBe(true);
      expect(config.baseDelayMs).toBe(100);
    });

    it('should use default values when not specified', () => {
      const task: TaskDefinition = {
        id: 'testTask',
        handler: async () => 'test',
      };

      const config = createRetryConfig(task);

      expect(config.maxRetries).toBe(0);
      expect(config.timeoutMs).toBe(2000);
      expect(config.exponentialBackoff).toBe(true);
      expect(config.baseDelayMs).toBe(100);
    });
  });

  describe('validateRetryConfig', () => {
    it('should validate correct config', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        timeoutMs: 1000,
        exponentialBackoff: true,
        baseDelayMs: 100,
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
  });

  describe('exponential backoff', () => {
    it('should use exponential backoff for retries', async () => {
      const startTime = Date.now();
      let attemptCount = 0;

      const task: TaskDefinition = {
        id: 'backoffTask',
        handler: async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Task failed');
          }
          return 'success';
        },
        retries: 2,
        timeoutMs: 1000,
        retryableErrors: ['Task failed'],
      };

      const context = {
        taskId: 'backoffTask',
        startTime: Date.now(),
        retryCount: 0,
        maxRetries: 2,
        timeoutMs: 1000,
      };

      await service.executeWithRetry(task, context);

      const totalTime = Date.now() - startTime;
      // Should take at least 300ms (100ms + 200ms delays)
      expect(totalTime).toBeGreaterThan(300);
    });
  });
});
