import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { TaskExtractorService } from './services/task-extractor.service';
import { DecoratedTasksService } from './services/decorated-tasks.service';
import { WorkflowResult } from './interfaces/task.interface';

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
          provide: DecoratedTasksService,
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

  describe('runDecoratedWorkflow', () => {
    it('should return workflow result', async () => {
      const mockResult: WorkflowResult = {
        success: true,
        results: new Map(),
        duration: 250,
        errors: [],
      };

      jest.spyOn(workflowEngine, 'run').mockResolvedValue(mockResult);

      const result = await controller.runDecoratedWorkflow();
      expect(result).toBe(mockResult);
      expect(workflowEngine.run).toHaveBeenCalledTimes(1);
    });
  });
}); 