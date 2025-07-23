import { SetMetadata } from '@nestjs/common';

/**
 * Task Decorator System
 * 
 * Provides a declarative way to define workflow tasks using method decorators.
 * This enables defining tasks directly on service methods instead of creating
 * separate task definition objects.
 * 
 * Integration Flow:
 * 1. @TaskStep decorator stores metadata on method
 * 2. TaskExtractorService scans for decorated methods at runtime
 * 3. Metadata is converted to TaskDefinition objects
 * 4. Workflow engine executes tasks using the standard flow
 */

/**
 * Task Metadata Configuration
 * 
 * Defines the configuration options available for task decoration.
 * This matches the core TaskDefinition interface but excludes runtime
 * properties like handler (derived from the decorated method).
 */
export interface TaskMetadata {
  /** Unique task identifier for dependency resolution and logging */
  id: string;
  
  /** Array of task IDs that must complete before this task executes */
  dependencies?: string[];
  
  /** Maximum retry attempts (uses system default if not specified) */
  retries?: number;
  
  /** Task timeout in milliseconds (uses system default if not specified) */
  timeoutMs?: number;
  
  /** Human-readable task description for documentation */
  description?: string;
}

/**
 * Metadata Storage Key
 * 
 * Unique symbol used by NestJS to store and retrieve task metadata.
 * The 'workflow:task' namespace prevents conflicts with other decorators.
 */
export const TASK_METADATA_KEY = 'workflow:task';

/**
 * TaskStep Decorator Factory
 * 
 * Creates a method decorator that marks a service method as a workflow task.
 * The decorated method becomes a task handler, and the metadata defines
 * task configuration and dependencies.
 *
 * @param metadata Task configuration matching TaskMetadata interface
 * @returns Method decorator function
 */
export const TaskStep = (metadata: TaskMetadata) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Attach metadata to the method using NestJS metadata system
    // This allows TaskExtractorService to discover and extract task definitions
    SetMetadata(TASK_METADATA_KEY, metadata)(target, propertyKey, descriptor);

    // Return the original descriptor unchanged
    // The method continues to work normally when called directly
    // But can also be extracted as a workflow task
    return descriptor;
  };
};
