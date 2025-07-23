import { RetryStrategy } from '@workflow/interfaces/retry.interface';

/**
 * Core Workflow Engine Data Structures
 * 
 * These interfaces define the contract for task definitions and execution results
 * in the workflow engine. They support dependency management, retry policies,
 * and comprehensive execution tracking.
 */

/**
 * Task Definition Interface
 * 
 * Defines a single executable unit within a workflow with its configuration.
 * 
 * Design Decisions:
 * - Uses string IDs for simplicity and debugging (human-readable)
 * - Handler function is async to support both sync and async operations
 * - Dependencies are optional to support both independent and dependent tasks
 * - All configuration is optional with sensible defaults
 * - Supports distributed tracing via workflowId
 * 
 * Dependency Resolution:
 * - Tasks with no dependencies execute immediately
 * - Tasks with dependencies wait for all dependencies to complete
 * - Circular dependencies are detected during validation
 */
export interface TaskDefinition {
  /** Unique identifier for the task (used for dependency resolution and logging) */
  id: string;
  
  /** Async function that performs the actual work of the task */
  handler: () => Promise<any>;
  
  /** Array of task IDs that must complete before this task can execute */
  dependencies?: string[];
  
  /** Maximum number of retry attempts (defaults to system default) */
  retries?: number;
  
  /** Task timeout in milliseconds (defaults to system default) */
  timeoutMs?: number;
  
  /** Human-readable description for documentation and debugging */
  description?: string;
  
  /** Strategy for calculating retry delays (exponential, linear, fixed) */
  retryStrategy?: RetryStrategy;
  
  /** Array of error types/messages that should trigger retries (others fail immediately) */
  retryableErrors?: string[];
  
  /** Workflow identifier for distributed tracing and correlation */
  workflowId?: string;
}

/**
 * Task Execution Result
 * 
 * Comprehensive record of a task's execution including success/failure status,
 * output data, performance metrics, and retry information.
 * 
 * Result Storage:
 * - Results are stored regardless of success/failure for complete workflow tracking
 * - Success=false + data=undefined indicates task failure
 * - Success=true + data=result indicates task success
 * - Error field is only populated on failure
 * 
 * Performance Tracking:
 * - Duration includes all retry attempts and delays
 * - RetryCount tracks actual retry attempts (0 = no retries needed)
 */
export interface TaskResult {
  /** Task identifier matching the original TaskDefinition.id */
  id: string;
  
  /** Whether the task completed successfully (true) or failed (false) */
  success: boolean;
  
  /** Task output data (only present on successful execution) */
  data?: any;
  
  /** Error that caused task failure (only present on failed execution) */
  error?: Error;
  
  /** Total execution time in milliseconds (includes retries and delays) */
  duration: number;
  
  /** Number of retry attempts that were made (0 = succeeded on first try) */
  retryCount: number;
}

/**
 * Task Execution Context
 * 
 * Runtime context passed through the execution chain to track timing,
 * retry state, and configuration. This provides the retry handler with
 * all necessary information for intelligent retry decisions.
 * 
 * Context Evolution:
 * - Created at task start with initial values
 * - retryCount is incremented with each retry attempt
 * - Used by retry handler to make retry/failure decisions
 */
export interface TaskExecutionContext {
  /** Task identifier for correlation and logging */
  taskId: string;
  
  /** Timestamp when task execution began (used for duration calculation) */
  startTime: number;
  
  /** Current retry attempt number (starts at 0, incremented on each retry) */
  retryCount: number;
  
  /** Maximum allowed retry attempts (from TaskDefinition or system default) */
  maxRetries: number;
  
  /** Task timeout in milliseconds (from TaskDefinition or system default) */
  timeoutMs: number;
}

/**
 * Complete Workflow Execution Result
 * 
 * High-level summary of an entire workflow execution including success status,
 * all task results, performance metrics, and error summary.
 * 
 * Success Criteria:
 * - success=true only if ALL tasks completed successfully
 * - success=false if ANY task failed (other tasks may still have completed)
 * - Individual task results are available regardless of overall success
 * 
 * Error Handling Philosophy:
 * - Workflow continues executing independent tasks even if some tasks fail
 * - All errors are collected for analysis and debugging
 * - Results map contains outcomes for all attempted tasks
 */  
export interface WorkflowResult {
  /** Overall workflow success (true only if all tasks succeeded) */
  success: boolean;
  
  /** Map of task IDs to their execution results (includes both successful and failed tasks) */
  results: Map<string, TaskResult>;
  
  /** Total workflow execution time in milliseconds */
  duration: number;
  
  /** Array of all errors encountered during workflow execution */
  errors: Error[];
}
