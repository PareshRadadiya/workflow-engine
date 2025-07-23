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

@Injectable()
export class RetryHandlerService {
  private readonly logger = new Logger(RetryHandlerService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Executes a task with retry logic
   * @param task Task definition to execute
   * @param context Execution context
   * @returns RetryResult with execution outcome
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

    while (retryCount <= config.maxRetries) {
      const attemptStartTime = Date.now();

      try {
        const result = await this.executeTaskWithTimeout(
          task,
          context,
          config.timeoutMs,
        );

        // Record successful attempt
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

        // Record failed attempt
        attempts.push({
          timestamp: Date.now(),
          success: false,
          errorMessage: lastError.message,
          duration: Date.now() - attemptStartTime,
        });

        // Check if error is retryable
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
          break; // Don't retry non-retryable errors
        }
      }
    }

    // All retries exhausted
    const finalResult: TaskResult = {
      id: task.id,
      success: false,
      error: lastError!,
      duration: Date.now() - context.startTime,
      retryCount: retryCount - 1,
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
   * Executes a task with timeout
   * @param task Task definition
   * @param context Execution context
   * @param timeoutMs Timeout in milliseconds
   * @returns TaskResult
   */
  private async executeTaskWithTimeout(
    task: TaskDefinition,
    context: TaskExecutionContext,
    timeoutMs: number,
  ): Promise<TaskResult> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const taskPromise = task.handler().then((data) => ({
      id: task.id,
      success: true,
      data,
      duration: Date.now() - context.startTime,
      retryCount: context.retryCount,
    }));

    return Promise.race([taskPromise, timeoutPromise]);
  }

  /**
   * Handles retry logic including backoff delay and event emission
   * @param task Task definition
   * @param retryCount Current retry attempt number
   * @param config Retry configuration
   * @param error Error that caused the retry
   * @param workflowId Workflow identifier for logging
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

    this.eventEmitter.emit(WorkflowEvent.TASK_RETRY, {
      taskId: task.id,
      workflowId,
      retryCount,
      error: error.message,
    });

    // Calculate delay using the utility function
    const retryDelay = calculateRetryDelay(retryCount, config);
    await delay(retryDelay);
  }
}
