import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowValidatorService } from './workflow-validator.service';
import { TaskDefinition } from './task.interface';

describe('WorkflowValidatorService', () => {
  let service: WorkflowValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowValidatorService],
    }).compile();

    service = module.get<WorkflowValidatorService>(WorkflowValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateWorkflow', () => {
    it('should validate a valid workflow', () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => 'result1',
        },
        {
          id: 'task2',
          dependencies: ['task1'],
          handler: async () => 'result2',
        },
      ];

      expect(() => service.validateWorkflow(workflow)).not.toThrow();
    });

    it('should throw error for duplicate task IDs', () => {
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

      expect(() => service.validateWorkflow(workflow)).toThrow(
        'Duplicate task IDs found in workflow',
      );
    });

    it('should throw error for non-existent dependencies', () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          dependencies: ['nonExistentTask'],
          handler: async () => 'result1',
        },
      ];

      expect(() => service.validateWorkflow(workflow)).toThrow(
        "Task 'task1' depends on non-existent task 'nonExistentTask'",
      );
    });

    it('should throw error for circular dependencies', () => {
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

      expect(() => service.validateWorkflow(workflow)).toThrow(
        'Circular dependency detected involving task',
      );
    });

    it('should throw error for self-dependency', () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          dependencies: ['task1'],
          handler: async () => 'result1',
        },
      ];

      expect(() => service.validateWorkflow(workflow)).toThrow(
        'Circular dependency detected involving task',
      );
    });
  });

  describe('validateTask', () => {
    it('should validate a valid task', () => {
      const task: TaskDefinition = {
        id: 'task1',
        handler: async () => 'result1',
        retries: 2,
        timeoutMs: 1000,
        dependencies: ['task2'],
      };

      expect(() => service.validateTask(task)).not.toThrow();
    });

    it('should throw error for empty task ID', () => {
      const task: TaskDefinition = {
        id: '',
        handler: async () => 'result1',
      };

      expect(() => service.validateTask(task)).toThrow(
        'Task ID is required and cannot be empty',
      );
    });

    it('should throw error for missing handler', () => {
      const task = {
        id: 'task1',
        handler: 'not a function',
      } as unknown as TaskDefinition;

      expect(() => service.validateTask(task)).toThrow(
        "Task 'task1' must have a valid handler function",
      );
    });

    it('should throw error for negative retries', () => {
      const task: TaskDefinition = {
        id: 'task1',
        handler: async () => 'result1',
        retries: -1,
      };

      expect(() => service.validateTask(task)).toThrow(
        "Task 'task1' retries must be a non-negative integer",
      );
    });

    it('should throw error for non-integer retries', () => {
      const task: TaskDefinition = {
        id: 'task1',
        handler: async () => 'result1',
        retries: 1.5,
      };

      expect(() => service.validateTask(task)).toThrow(
        "Task 'task1' retries must be a non-negative integer",
      );
    });

    it('should throw error for non-positive timeout', () => {
      const task: TaskDefinition = {
        id: 'task1',
        handler: async () => 'result1',
        timeoutMs: 0,
      };

      expect(() => service.validateTask(task)).toThrow(
        "Task 'task1' timeoutMs must be a positive integer",
      );
    });

    it('should throw error for non-integer timeout', () => {
      const task: TaskDefinition = {
        id: 'task1',
        handler: async () => 'result1',
        timeoutMs: 100.5,
      };

      expect(() => service.validateTask(task)).toThrow(
        "Task 'task1' timeoutMs must be a positive integer",
      );
    });

    it('should throw error for non-array dependencies', () => {
      const task = {
        id: 'task1',
        handler: async () => 'result1',
        dependencies: 'not an array',
      } as unknown as TaskDefinition;

      expect(() => service.validateTask(task)).toThrow(
        "Task 'task1' dependencies must be an array",
      );
    });

    it('should throw error for empty dependency ID', () => {
      const task: TaskDefinition = {
        id: 'task1',
        handler: async () => 'result1',
        dependencies: [''],
      };

      expect(() => service.validateTask(task)).toThrow(
        "Task 'task1' has invalid dependency ID: ",
      );
    });

    it('should throw error for self-dependency', () => {
      const task: TaskDefinition = {
        id: 'task1',
        handler: async () => 'result1',
        dependencies: ['task1'],
      };

      expect(() => service.validateTask(task)).toThrow(
        "Task 'task1' cannot depend on itself",
      );
    });
  });

  describe('getTransitiveDependencies', () => {
    it('should get direct dependencies', () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => 'result1',
        },
        {
          id: 'task2',
          dependencies: ['task1'],
          handler: async () => 'result2',
        },
      ];

      const dependencies = service.getTransitiveDependencies('task2', workflow);
      expect(dependencies).toEqual(new Set(['task1']));
    });

    it('should get transitive dependencies', () => {
      const workflow: TaskDefinition[] = [
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

      const dependencies = service.getTransitiveDependencies('task3', workflow);
      expect(dependencies).toEqual(new Set(['task1', 'task2']));
    });

    it('should return empty set for task with no dependencies', () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => 'result1',
        },
      ];

      const dependencies = service.getTransitiveDependencies('task1', workflow);
      expect(dependencies).toEqual(new Set());
    });
  });

  describe('getExecutionOrder', () => {
    it('should return correct execution order for simple workflow', () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => 'result1',
        },
        {
          id: 'task2',
          dependencies: ['task1'],
          handler: async () => 'result2',
        },
      ];

      const executionOrder = service.getExecutionOrder(workflow);
      expect(executionOrder).toEqual(['task1', 'task2']);
    });

    it('should return correct execution order for complex workflow', () => {
      const workflow: TaskDefinition[] = [
        {
          id: 'task1',
          handler: async () => 'result1',
        },
        {
          id: 'task2',
          handler: async () => 'result2',
        },
        {
          id: 'task3',
          dependencies: ['task1', 'task2'],
          handler: async () => 'result3',
        },
        {
          id: 'task4',
          dependencies: ['task3'],
          handler: async () => 'result4',
        },
      ];

      const executionOrder = service.getExecutionOrder(workflow);

      // task1 and task2 should come before task3
      expect(executionOrder.indexOf('task1')).toBeLessThan(
        executionOrder.indexOf('task3'),
      );
      expect(executionOrder.indexOf('task2')).toBeLessThan(
        executionOrder.indexOf('task3'),
      );

      // task3 should come before task4
      expect(executionOrder.indexOf('task3')).toBeLessThan(
        executionOrder.indexOf('task4'),
      );

      // All tasks should be present
      expect(executionOrder).toContain('task1');
      expect(executionOrder).toContain('task2');
      expect(executionOrder).toContain('task3');
      expect(executionOrder).toContain('task4');
    });

    it('should throw error for circular dependencies', () => {
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

      expect(() => service.getExecutionOrder(workflow)).toThrow(
        'Circular dependency detected involving task',
      );
    });
  });
});
