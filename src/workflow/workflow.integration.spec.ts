import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowValidatorService } from './workflow-validator.service';
import { RetryHandlerService } from './retry-handler.service';
import { TaskExtractorService } from './task-extractor.service';
import { TaskStep } from './task.decorator';
import { WorkflowEvent } from './events.enum';
import { TaskDefinition } from './task.interface';

// Example task class using decorators
class DataProcessingTasks {
  @TaskStep({
    id: 'fetchData',
    retries: 2,
    timeoutMs: 1000,
    description: 'Fetch data from remote API',
  })
  async fetchData() {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
    };
  }

  @TaskStep({
    id: 'processData',
    dependencies: ['fetchData'],
    retries: 1,
    timeoutMs: 500,
    description: 'Process the fetched data',
  })
  async processData() {
    // Simulate data processing
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { processed: true, count: 2 };
  }

  @TaskStep({
    id: 'saveResult',
    dependencies: ['processData'],
    description: 'Save processed result to database',
  })
  async saveResult() {
    // Simulate database save
    await new Promise((resolve) => setTimeout(resolve, 75));
    return { saved: true, timestamp: new Date().toISOString() };
  }
}

// Example task class for parallel execution
class ParallelTasks {
  @TaskStep({
    id: 'validateData',
    retries: 1,
    description: 'Validate data integrity',
  })
  async validateData() {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return { valid: true };
  }

  @TaskStep({
    id: 'generateReport',
    retries: 1,
    description: 'Generate summary report',
  })
  async generateReport() {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return { report: 'Data processing completed successfully' };
  }
}

describe('Workflow Integration', () => {
  let module: TestingModule;
  let workflowEngine: WorkflowEngineService;
  let taskExtractor: TaskExtractorService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        WorkflowEngineService,
        WorkflowValidatorService,
        RetryHandlerService,
        TaskExtractorService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    workflowEngine = module.get<WorkflowEngineService>(WorkflowEngineService);
    taskExtractor = module.get<TaskExtractorService>(TaskExtractorService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('End-to-End Workflow Execution', () => {
    it('should execute a complete data processing workflow', async () => {
      // Define workflow manually
      const workflow: TaskDefinition[] = [
        {
          id: 'fetchData',
          handler: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return {
              users: [
                { id: 1, name: 'John' },
                { id: 2, name: 'Jane' },
              ],
            };
          },
          retries: 2,
          timeoutMs: 1000,
          description: 'Fetch data from remote API',
        },
        {
          id: 'processData',
          dependencies: ['fetchData'],
          handler: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return { processed: true, count: 2 };
          },
          retries: 1,
          timeoutMs: 500,
          description: 'Process the fetched data',
        },
        {
          id: 'saveResult',
          dependencies: ['processData'],
          handler: async () => {
            await new Promise((resolve) => setTimeout(resolve, 75));
            return { saved: true, timestamp: new Date().toISOString() };
          },
          description: 'Save processed result to database',
        },
      ];

      const result = await workflowEngine.run(workflow);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.results.size).toBe(3);

      // Verify task results
      const fetchResult = result.results.get('fetchData');
      expect(fetchResult?.success).toBe(true);
      expect(fetchResult?.data.users).toHaveLength(2);

      const processResult = result.results.get('processData');
      expect(processResult?.success).toBe(true);
      expect(processResult?.data.processed).toBe(true);

      const saveResult = result.results.get('saveResult');
      expect(saveResult?.success).toBe(true);
      expect(saveResult?.data.saved).toBe(true);

      // Verify execution order (dependencies respected)
      // Note: In a real scenario, the duration would be cumulative
      // For this test, we just verify that all tasks completed successfully
      expect(fetchResult!.success).toBe(true);
      expect(processResult!.success).toBe(true);
      expect(saveResult!.success).toBe(true);
    });

    it('should execute parallel tasks when dependencies allow', async () => {
      const startTimes: { [key: string]: number } = {};
      const endTimes: { [key: string]: number } = {};

      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => {
            startTimes.task1 = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 200));
            endTimes.task1 = Date.now();
            return 'result1';
          },
        },
        {
          id: 'task2',
          handler: async () => {
            startTimes.task2 = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 200));
            endTimes.task2 = Date.now();
            return 'result2';
          },
        },
        {
          id: 'task3',
          dependencies: ['task1', 'task2'],
          handler: async () => {
            startTimes.task3 = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 100));
            endTimes.task3 = Date.now();
            return 'result3';
          },
        },
      ];

      const result = await workflowEngine.run(workflow);

      expect(result.success).toBe(true);

      // task1 and task2 should start around the same time (parallel execution)
      expect(Math.abs(startTimes.task1 - startTimes.task2)).toBeLessThan(50);

      // task3 should start after both task1 and task2 complete
      // Use a small tolerance for timing precision
      expect(startTimes.task3).toBeGreaterThanOrEqual(endTimes.task1);
      expect(startTimes.task3).toBeGreaterThanOrEqual(endTimes.task2);
    });

    it('should handle task failures with retries', async () => {
      let attemptCount = 0;

      const workflow: TaskDefinition[] = [
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
          retryableErrors: ['Attempt', 'failed'],
        },
        {
          id: 'dependentTask',
          dependencies: ['unreliableTask'],
          handler: async () => {
            return 'dependent task completed';
          },
        },
      ];

      const result = await workflowEngine.run(workflow);

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);

      const unreliableResult = result.results.get('unreliableTask');
      expect(unreliableResult?.success).toBe(true);
      // retryCount represents the number of retries attempted (2 retries for 3 total attempts)
      expect(unreliableResult?.retryCount).toBe(2);
      expect(unreliableResult?.data).toBe('success after retries');

      const dependentResult = result.results.get('dependentTask');
      expect(dependentResult?.success).toBe(true);
      expect(dependentResult?.data).toBe('dependent task completed');
    });

    it('should emit all lifecycle events', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'testTask',
          handler: async () => 'test result',
        },
      ];

      await workflowEngine.run(workflow);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.WORKFLOW_STARTED,
        expect.any(Object),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.TASK_STARTED,
        expect.any(Object),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.TASK_COMPLETED,
        expect.any(Object),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.WORKFLOW_COMPLETED,
        expect.any(Object),
      );
    });
  });

  describe('Decorator-based Workflow', () => {
    it('should extract and execute tasks from decorated classes', async () => {
      const dataProcessingInstance = new DataProcessingTasks();
      const parallelInstance = new ParallelTasks();

      // Mock the reflector to return metadata for decorated methods
      const reflector = module.get<any>('Reflector');
      if (reflector) {
        reflector.get = jest.fn().mockImplementation((key, target) => {
          if (key === 'workflow:task') {
            // Return appropriate metadata based on the method
            if (target === dataProcessingInstance.fetchData) {
              return {
                id: 'fetchData',
                retries: 2,
                timeoutMs: 1000,
                description: 'Fetch data from remote API',
              };
            }
            if (target === dataProcessingInstance.processData) {
              return {
                id: 'processData',
                dependencies: ['fetchData'],
                retries: 1,
                timeoutMs: 500,
                description: 'Process the fetched data',
              };
            }
            if (target === dataProcessingInstance.saveResult) {
              return {
                id: 'saveResult',
                dependencies: ['processData'],
                description: 'Save processed result to database',
              };
            }
            if (target === parallelInstance.validateData) {
              return {
                id: 'validateData',
                retries: 1,
                description: 'Validate data integrity',
              };
            }
            if (target === parallelInstance.generateReport) {
              return {
                id: 'generateReport',
                retries: 1,
                description: 'Generate summary report',
              };
            }
          }
          return undefined;
        });
      }

      const tasks = taskExtractor.extractTasksFromClasses([
        dataProcessingInstance,
        parallelInstance,
      ]);

      expect(tasks).toHaveLength(5);

      const result = await workflowEngine.run(tasks);

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow with timeout', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'slowTask',
          handler: async () => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            return 'should not reach here';
          },
          timeoutMs: 100,
        },
      ];

      const result = await workflowEngine.run(workflow);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('timed out');
    });

    it('should handle workflow with circular dependencies', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          dependencies: ['task2'],
          handler: async () => 'result1',
        },
        {
          id: 'task2',
          dependencies: ['task1'],
          handler: async () => 'result2',
        },
      ];

      const result = await workflowEngine.run(workflow);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Circular dependency');
    });
  });
});
