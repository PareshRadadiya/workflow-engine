import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from './workflow-engine.service';
import { TaskExtractorService } from './task-extractor.service';
import { ExampleTasksService } from './example-tasks.service';
import { WorkflowResult } from './task.interface';
import { TestUtils } from './test-utils';

describe('WorkflowController', () => {
  let controller: WorkflowController;
  let workflowEngine: WorkflowEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        {
          provide: WorkflowEngineService,
          useValue: {
            run: jest.fn(),
          },
        },
        {
          provide: TaskExtractorService,
          useValue: {
            extractTasksFromClass: jest.fn(),
          },
        },
        {
          provide: ExampleTasksService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<WorkflowController>(WorkflowController);
    workflowEngine = module.get<WorkflowEngineService>(WorkflowEngineService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('runSimpleWorkflow', () => {
    it('should return workflow result', async () => {
      const mockResult: WorkflowResult = {
        success: true,
        results: new Map(),
        duration: 100,
        errors: [],
      };

      jest.spyOn(workflowEngine, 'run').mockResolvedValue(mockResult);

      const result = await controller.runSimpleWorkflow();
      expect(result).toBe(mockResult);
      expect(workflowEngine.run).toHaveBeenCalledTimes(1);
      expect(workflowEngine.run).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'task1' }),
        expect.objectContaining({ id: 'task2' }),
      ]));
    });
  });

  describe('runDependencyWorkflow', () => {
    it('should return workflow result', async () => {
      const mockResult: WorkflowResult = {
        success: true,
        results: new Map(),
        duration: 200,
        errors: [],
      };

      jest.spyOn(workflowEngine, 'run').mockResolvedValue(mockResult);

      const result = await controller.runDependencyWorkflow();
      expect(result).toBe(mockResult);
      expect(workflowEngine.run).toHaveBeenCalledTimes(1);
      expect(workflowEngine.run).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'task1' }),
        expect.objectContaining({ id: 'task2', dependencies: ['task1'] }),
        expect.objectContaining({ id: 'task3', dependencies: ['task2'] }),
      ]));
    });
  });

  describe('runParallelWorkflow', () => {
    it('should return workflow result', async () => {
      const mockResult: WorkflowResult = {
        success: true,
        results: new Map(),
        duration: 150,
        errors: [],
      };

      jest.spyOn(workflowEngine, 'run').mockResolvedValue(mockResult);

      const result = await controller.runParallelWorkflow();
      expect(result).toBe(mockResult);
      expect(workflowEngine.run).toHaveBeenCalledTimes(1);
      expect(workflowEngine.run).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'task1' }),
        expect.objectContaining({ id: 'task2' }),
        expect.objectContaining({ id: 'task3', dependencies: ['task1', 'task2'] }),
      ]));
    });
  });

  describe('runRetryWorkflow', () => {
    it('should return workflow result', async () => {
      const mockResult: WorkflowResult = {
        success: true,
        results: new Map(),
        duration: 300,
        errors: [],
      };

      jest.spyOn(workflowEngine, 'run').mockResolvedValue(mockResult);

      const result = await controller.runRetryWorkflow();
      expect(result).toBe(mockResult);
      expect(workflowEngine.run).toHaveBeenCalledTimes(1);
      expect(workflowEngine.run).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'unreliableTask', retries: 2, timeoutMs: 1000 }),
        expect.objectContaining({ id: 'dependentTask', dependencies: ['unreliableTask'] }),
      ]));
    });
  });

  describe('getExampleWorkflows', () => {
    it('should return example workflows', () => {
      const result = controller.getExampleWorkflows();
      
      expect(result).toHaveProperty('simple');
      expect(result).toHaveProperty('withDependencies');
      expect(result).toHaveProperty('parallel');
      expect(result).toHaveProperty('retry');
    });
  });
}); 