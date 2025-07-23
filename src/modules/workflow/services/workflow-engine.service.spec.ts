import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowEngineService } from './workflow-engine.service';
import { ValidatorService } from '../services/validator.service';
import { RetryHandlerService } from './retry-handler.service';
import { TaskDefinition } from '../interfaces/task.interface';
import { WorkflowEvent } from '../enums/events.enum';

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowEngineService,
        ValidatorService,
        RetryHandlerService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkflowEngineService>(WorkflowEngineService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('run', () => {
    it('should execute a simple workflow successfully', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => 'result1',
        },
        {
          id: 'task2',
          handler: async () => 'result2',
        },
      ];

      const result = await service.run(workflow);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.results.get('task1')?.success).toBe(true);
      expect(result.results.get('task1')?.data).toBe('result1');
      expect(result.results.get('task2')?.success).toBe(true);
      expect(result.results.get('task2')?.data).toBe('result2');
    });

    it('should execute tasks with dependencies in correct order', async () => {
      const executionOrder: string[] = [];

      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => {
            executionOrder.push('task1');
            return 'result1';
          },
        },
        {
          id: 'task2',
          dependencies: ['task1'],
          handler: async () => {
            executionOrder.push('task2');
            return 'result2';
          },
        },
        {
          id: 'task3',
          dependencies: ['task2'],
          handler: async () => {
            executionOrder.push('task3');
            return 'result3';
          },
        },
      ];

      const result = await service.run(workflow);

      expect(result.success).toBe(true);
      expect(executionOrder).toEqual(['task1', 'task2', 'task3']);
    });

    it('should execute independent tasks in parallel', async () => {
      const startTimes: { [key: string]: number } = {};
      const endTimes: { [key: string]: number } = {};

      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => {
            startTimes.task1 = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 100));
            endTimes.task1 = Date.now();
            return 'result1';
          },
        },
        {
          id: 'task2',
          handler: async () => {
            startTimes.task2 = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 100));
            endTimes.task2 = Date.now();
            return 'result2';
          },
        },
      ];

      const result = await service.run(workflow);

      expect(result.success).toBe(true);
      // Both tasks should start around the same time (within 50ms)
      expect(Math.abs(startTimes.task1 - startTimes.task2)).toBeLessThan(50);
    });

    it('should retry failed tasks', async () => {
      let attemptCount = 0;

      const workflow: TaskDefinition[] = [
        {
          id: 'failingTask',
          handler: async () => {
            attemptCount++;
            if (attemptCount < 3) {
              throw new Error('Task failed');
            }
            return 'success';
          },
          retries: 2,
          retryableErrors: ['Task failed'],
        },
      ];

      const result = await service.run(workflow);

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
      // retryCount represents the number of retries attempted (2 retries for 3 total attempts)
      expect(result.results.get('failingTask')?.retryCount).toBe(2);
    });

    it('should fail after max retries', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'failingTask',
          handler: async () => {
            throw new Error('Task always fails');
          },
          retries: 1,
          retryableErrors: ['Task always fails'],
        },
      ];

      const result = await service.run(workflow);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.results.get('failingTask')?.success).toBe(false);
      // retryCount represents the number of retries attempted (1 retry for 2 total attempts)
      expect(result.results.get('failingTask')?.retryCount).toBe(1);
    });

    it('should timeout tasks', async () => {
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

      const result = await service.run(workflow);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('timed out');
    });

    it('should validate workflow with duplicate task IDs', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => 'result1',
        },
        {
          id: 'task1', // Duplicate ID
          handler: async () => 'result2',
        },
      ];

      const result = await service.run(workflow);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Duplicate task IDs');
    });

    it('should validate workflow with non-existent dependencies', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          dependencies: ['nonExistentTask'],
          handler: async () => 'result1',
        },
      ];

      const result = await service.run(workflow);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain(
        'depends on non-existent task',
      );
    });

    it('should detect circular dependencies', async () => {
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

      const result = await service.run(workflow);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Circular dependency');
    });

    it('should emit lifecycle events', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => 'result1',
        },
      ];

      await service.run(workflow);

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

    it('should emit retry events', async () => {
      let attemptCount = 0;

      const workflow: TaskDefinition[] = [
        {
          id: 'failingTask',
          handler: async () => {
            attemptCount++;
            if (attemptCount < 2) {
              throw new Error('Task failed');
            }
            return 'success';
          },
          retries: 1,
          retryableErrors: ['Task failed'],
        },
      ];

      await service.run(workflow);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.TASK_RETRY,
        expect.any(Object),
      );
    });

    it('should emit failure events', async () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'failingTask',
          handler: async () => {
            throw new Error('Task always fails');
          },
          retries: 0,
        },
      ];

      await service.run(workflow);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.TASK_FAILED,
        expect.any(Object),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WorkflowEvent.WORKFLOW_FAILED,
        expect.any(Object),
      );
    });
  });
});
