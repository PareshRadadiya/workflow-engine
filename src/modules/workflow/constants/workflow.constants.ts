/**
 * Shared constants to eliminate redundant values across services
 */
export const WORKFLOW_CONSTANTS = {
  DEFAULT_TIMEOUT_MS: 2000,
  DEFAULT_RETRIES: 0,
  DEFAULT_BASE_DELAY_MS: 100,
} as const;

/**
 * Default retryable error types
 */
export const DEFAULT_RETRYABLE_ERRORS = [
  'timeout',
  'timed out',
  'network',
  'connection',
  'temporary',
  'rate limit',
  'server error',
] as const;

/**
 * Error messages for validation
 */
export const VALIDATION_ERRORS = {
  DUPLICATE_TASK_IDS: 'Duplicate task IDs found in workflow',
  NON_EXISTENT_DEPENDENCY: (taskId: string, depId: string) =>
    `Task '${taskId}' depends on non-existent task '${depId}'`,
  CIRCULAR_DEPENDENCY: (taskId: string) =>
    `Circular dependency detected involving task '${taskId}'`,
  EMPTY_TASK_ID: 'Task ID is required and cannot be empty',
  INVALID_HANDLER: (taskId: string) =>
    `Task '${taskId}' must have a valid handler function`,
  INVALID_RETRIES: (taskId: string) =>
    `Task '${taskId}' retries must be a non-negative integer`,
  INVALID_TIMEOUT: (taskId: string) =>
    `Task '${taskId}' timeoutMs must be a positive integer`,
  INVALID_DEPENDENCIES: (taskId: string) =>
    `Task '${taskId}' dependencies must be an array`,
  INVALID_DEPENDENCY_ID: (taskId: string, depId: string) =>
    `Task '${taskId}' has invalid dependency ID: ${depId}`,
  SELF_DEPENDENCY: (taskId: string) =>
    `Task '${taskId}' cannot depend on itself`,
} as const;

/**
 * Log messages
 */
export const LOG_MESSAGES = {
  WORKFLOW_STARTED: (taskCount: number) =>
    `Starting workflow with ${taskCount} tasks`,
  WORKFLOW_COMPLETED: (duration: number) =>
    `Workflow completed successfully in ${duration}ms`,
  WORKFLOW_FAILED: (errorCount: number, duration: number) =>
    `Workflow failed with ${errorCount} errors in ${duration}ms`,
  WORKFLOW_EXECUTION_FAILED: (error: string) =>
    `Workflow execution failed: ${error}`,
  TASK_STARTED: (taskId: string) => `Starting task: ${taskId}`,
  TASK_COMPLETED: (taskId: string) => `Task ${taskId} completed successfully`,
  TASK_FAILED: (taskId: string, retries: number, error: string) =>
    `Task ${taskId} failed after ${retries} retries: ${error}`,
  DEADLOCK_DETECTED: (remainingTasks: string) =>
    `Deadlock detected. Remaining tasks: ${remainingTasks}`,
} as const;


