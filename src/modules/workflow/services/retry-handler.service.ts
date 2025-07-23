import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TaskDefinition,
  TaskResult,
  TaskExecutionContext,
} from '../interfaces/task.interface';
import { WorkflowEvent } from '../enums/events.enum';
import {
  delay,
  calculateRetryDelay,
  shouldRetry,
  createRetryConfig,
  validateRetryConfig,
} from '../utils/retry-utils';
import {
  RetryAttempt,
  RetryConfig,
  RetryResult,
} from '../interfaces/retry.interface';

/**
 * Retry Handler Service
 * 
 * Provides intelligent retry mechanisms for task execution with:
 * - Configurable retry strategies (exponential backoff, linear, fixed)
 * - Error-specific retry policies (some errors shouldn't be retried)
 * - Timeout handling for long-running tasks
 * - Comprehensive attempt tracking for debugging and monitoring
 * 
 * Retry Decision Logic:
 * 1. Check if error type is retryable (based on retryableErrors config)
 * 2. Verify retry count hasn't exceeded maxRetries
 * 3. Apply backoff strategy delay before next attempt
 * 4. Track all attempts for analysis and debugging
 * 
 * Common Non-Retryable Errors:
 * - Authentication/Authorization failures
 * - Validation errors (bad input data)
 * - Resource not found errors
 * - Business logic violations
 */
@Injectable()
export class RetryHandlerService {
  private readonly logger = new Logger(RetryHandlerService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Executes a task with intelligent retry logic and comprehensive error handling
   * 
   * Retry Flow:
   * 1. Validate retry configuration
   * 2. Execute task with timeout protection
   * 3. On success: return result immediately
   * 4. On failure: evaluate if error is retryable
   * 5. If retryable: apply backoff delay and retry
   * 6. If not retryable or retries exhausted: return failure
   * 
   * @param task Task definition with handler and retry configuration
   * @param context Execution context with timing and retry limits
   * @returns RetryResult with detailed execution information and attempt history
   */
  async executeWithRetry(
    task: TaskDefinition,
    context: TaskExecutionContext,
  ): Promise<RetryResult> {
    const config = createRetryConfig(task);
    validateRetryConfig(config);

    let lastError: Error;
    let retryCount = 0;
    const attempts: RetryAttempt[] = [];
    const workflowId = task.workflowId || 'unknown';

    // Main retry loop - continue until success or all retries exhausted
    while (retryCount <= config.maxRetries) {
      const attemptStartTime = Date.now();

      try {
        // Execute task with timeout protection
        const result = await this.executeTaskWithTimeout(
          task,
          context,
          config.timeoutMs,
        );

        // Success path - record attempt and return immediately
        attempts.push({
          timestamp: Date.now(),
          success: true,
          duration: Date.now() - attemptStartTime,
        });

        return {
          success: true,
          result: {
            ...result,
            retryCount,
          },
          retryCount,
          attempts,
        };
      } catch (error) {
        lastError = error as Error;
        retryCount++;

        // Record failed attempt with error details for debugging
        attempts.push({
          timestamp: Date.now(),
          success: false,
          errorMessage: lastError.message,
          duration: Date.now() - attemptStartTime,
        });

        // Determine if we should retry based on error type and remaining attempts
        if (
          retryCount <= config.maxRetries &&
          shouldRetry(lastError, task.retryableErrors)
        ) {
          await this.handleRetry(
            task,
            retryCount,
            config,
            lastError,
            workflowId,
          );
        } else {
          // Exit retry loop - either non-retryable error or retries exhausted
          break;
        }
      }
    }

    // All retries exhausted or non-retryable error encountered
    const finalResult: TaskResult = {
      id: task.id,
      success: false,
      error: lastError!,
      duration: Date.now() - context.startTime,
      retryCount: retryCount - 1, // Subtract 1 because retryCount includes the initial attempt
    };

    this.logger.error(
      `[Workflow: ${workflowId}] [Task: ${task.id}] Failed after ${retryCount - 1} retries: ${lastError!.message}`,
    );

    this.eventEmitter.emit(WorkflowEvent.TASK_FAILED, {
      taskId: task.id,
      workflowId,
      error: lastError!.message,
      retryCount: retryCount - 1,
    });

    return {
      success: false,
      result: finalResult,
      error: lastError!,
      retryCount: retryCount - 1,
      attempts,
    };
  }

  /**
   * Executes a task with timeout protection using Promise.race
   * 
   * Timeout Strategy:
   * - Creates two competing promises: task execution vs. timeout
   * - Whichever resolves first wins
   * - Timeout errors are treated as regular failures and can be retried
   * - This prevents tasks from hanging indefinitely
   * 
   * @param task Task definition with handler function
   * @param context Execution context for timing tracking
   * @param timeoutMs Maximum time to wait for task completion
   * @returns TaskResult with execution outcome
   */
  private async executeTaskWithTimeout(
    task: TaskDefinition,
    context: TaskExecutionContext,
    timeoutMs: number,
  ): Promise<TaskResult> {
    // Create timeout promise that rejects after specified time
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Create task execution promise
    const taskPromise = task.handler().then((data) => ({
      id: task.id,
      success: true,
      data,
      duration: Date.now() - context.startTime,
      retryCount: context.retryCount,
    }));

    // Race between task completion and timeout
    // Note: The losing promise continues running but its result is ignored
    return Promise.race([taskPromise, timeoutPromise]);
  }

  /**
   * Handles retry logic including backoff delay calculation and event emission
   * 
   * Backoff Strategies:
   * - Exponential: Delay doubles with each retry (1s, 2s, 4s, 8s...)
   * - Linear: Delay increases by fixed amount (1s, 2s, 3s, 4s...)
   * - Fixed: Same delay for all retries (1s, 1s, 1s, 1s...)
   * 
   * The delay helps prevent overwhelming failing services and gives them time to recover
   * 
   * @param task Task definition for logging context
   * @param retryCount Current retry attempt number (1-based)
   * @param config Retry configuration with strategy and timing
   * @param error Error that triggered the retry
   * @param workflowId Workflow identifier for tracing and logging
   */
  private async handleRetry(
    task: TaskDefinition,
    retryCount: number,
    config: RetryConfig,
    error: Error,
    workflowId: string,
  ): Promise<void> {
    this.logger.warn(
      `[Workflow: ${workflowId}] [Task: ${task.id}] Retry ${retryCount}/${config.maxRetries}: ${error.message}`,
    );

    // Emit retry event for monitoring and debugging
    this.eventEmitter.emit(WorkflowEvent.TASK_RETRY, {
      taskId: task.id,
      workflowId,
      retryCount,
      error: error.message,
    });

    // Calculate appropriate delay based on retry strategy
    // This prevents overwhelming the failing service and gives it time to recover
    const retryDelay = calculateRetryDelay(retryCount, config);
    await delay(retryDelay);
  }
}
