import { TaskResult } from "@workflow/interfaces/task.interface";

export interface RetryResult {
  success: boolean;
  result?: TaskResult;
  error?: Error;
  retryCount: number;
  attempts?: RetryAttempt[];
}

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