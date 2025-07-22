import { RetryStrategy } from './utils/retry-utils';

export interface TaskDefinition {
  id: string;
  handler: () => Promise<any>;
  dependencies?: string[];
  retries?: number;
  timeoutMs?: number;
  description?: string;
  retryStrategy?: RetryStrategy;
  retryableErrors?: string[];
  workflowId?: string; // For distributed tracing
}

export interface TaskResult {
  id: string;
  success: boolean;
  data?: any;
  error?: Error;
  duration: number;
  retryCount: number;
}

export interface TaskExecutionContext {
  taskId: string;
  startTime: number;
  retryCount: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface WorkflowResult {
  success: boolean;
  results: Map<string, TaskResult>;
  duration: number;
  errors: Error[];
}
