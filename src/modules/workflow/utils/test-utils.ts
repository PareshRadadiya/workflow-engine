import { TaskDefinition } from '../interfaces/task.interface';

/**
 * Test utilities to eliminate redundant code across test files
 */
export class TestUtils {
  /**
   * Creates a simple workflow with no dependencies
   */
  static createSimpleWorkflow(): TaskDefinition[] {
    return [
      {
        id: 'task1',
        handler: async () => 'result1',
      },
      {
        id: 'task2',
        handler: async () => 'result2',
      },
    ];
  }

  /**
   * Creates a workflow with dependencies
   */
  static createDependencyWorkflow(): TaskDefinition[] {
    return [
      {
        id: 'task1',
        handler: async () => 'result1',
      },
      {
        id: 'task2',
        dependencies: ['task1'],
        handler: async () => 'result2',
      },
      {
        id: 'task3',
        dependencies: ['task2'],
        handler: async () => 'result3',
      },
    ];
  }

  /**
   * Creates a workflow with parallel execution
   */
  static createParallelWorkflow(): TaskDefinition[] {
    return [
      {
        id: 'task1',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return 'result1';
        },
      },
      {
        id: 'task2',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return 'result2';
        },
      },
      {
        id: 'task3',
        dependencies: ['task1', 'task2'],
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return 'result3';
        },
      },
    ];
  }

  /**
   * Creates a workflow with retry logic
   */
  static createRetryWorkflow(): TaskDefinition[] {
    let attemptCount = 0;

    return [
      {
        id: 'unreliableTask',
        handler: async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error(`Attempt ${attemptCount} failed`);
          }
          return 'success after retries';
        },
        retries: 2,
        timeoutMs: 1000,
      },
      {
        id: 'dependentTask',
        dependencies: ['unreliableTask'],
        handler: async () => {
          return 'dependent task completed';
        },
      },
    ];
  }


}
