import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { TaskExtractorService } from './task-extractor.service';
import { TaskStep } from './task.decorator';

class TestTaskClass {
  @TaskStep({
    id: 'fetchData',
    retries: 2,
    timeoutMs: 1000,
    description: 'Fetch data from API',
  })
  async fetchData() {
    return 'data';
  }

  @TaskStep({
    id: 'processData',
    dependencies: ['fetchData'],
    retries: 1,
    description: 'Process the fetched data',
  })
  async processData() {
    return 'processed';
  }

  @TaskStep({
    id: 'saveData',
    dependencies: ['processData'],
    description: 'Save processed data',
  })
  async saveData() {
    return 'saved';
  }

  // Method without decorator
  async nonTaskMethod() {
    return 'not a task';
  }
}

describe('TaskExtractorService', () => {
  let service: TaskExtractorService;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskExtractorService,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskExtractorService>(TaskExtractorService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractTasksFromClass', () => {
    it('should extract tasks from decorated methods', () => {
      const testInstance = new TestTaskClass();

      // Mock the reflector to return metadata for decorated methods
      (reflector.get as jest.Mock).mockImplementation((key, target) => {
        if (key === 'workflow:task') {
          if (target === testInstance.fetchData) {
            return {
              id: 'fetchData',
              retries: 2,
              timeoutMs: 1000,
              description: 'Fetch data from API',
            };
          }
          if (target === testInstance.processData) {
            return {
              id: 'processData',
              dependencies: ['fetchData'],
              retries: 1,
              description: 'Process the fetched data',
            };
          }
          if (target === testInstance.saveData) {
            return {
              id: 'saveData',
              dependencies: ['processData'],
              description: 'Save processed data',
            };
          }
        }
        return undefined;
      });

      const tasks = service.extractTasksFromClass(testInstance);

      expect(tasks).toHaveLength(3);

      const fetchDataTask = tasks.find((t) => t.id === 'fetchData');
      expect(fetchDataTask).toBeDefined();
      expect(fetchDataTask?.retries).toBe(2);
      expect(fetchDataTask?.timeoutMs).toBe(1000);
      expect(fetchDataTask?.description).toBe('Fetch data from API');

      const processDataTask = tasks.find((t) => t.id === 'processData');
      expect(processDataTask).toBeDefined();
      expect(processDataTask?.dependencies).toEqual(['fetchData']);
      expect(processDataTask?.retries).toBe(1);

      const saveDataTask = tasks.find((t) => t.id === 'saveData');
      expect(saveDataTask).toBeDefined();
      expect(saveDataTask?.dependencies).toEqual(['processData']);
      expect(saveDataTask?.retries).toBeUndefined();
    });

    it('should not extract non-decorated methods', () => {
      const testInstance = new TestTaskClass();

      // Mock the reflector to return undefined for non-decorated methods
      (reflector.get as jest.Mock).mockReturnValue(undefined);

      const tasks = service.extractTasksFromClass(testInstance);

      expect(tasks).toHaveLength(0);
    });

    it('should create handlers that call the original methods', async () => {
      const testInstance = new TestTaskClass();
      const spy = jest.spyOn(testInstance, 'fetchData');

      (reflector.get as jest.Mock).mockReturnValue({
        id: 'fetchData',
        retries: 2,
        timeoutMs: 1000,
        description: 'Fetch data from API',
      });

      const tasks = service.extractTasksFromClass(testInstance);
      const fetchDataTask = tasks.find((t) => t.id === 'fetchData');

      expect(fetchDataTask).toBeDefined();

      const result = await fetchDataTask!.handler();

      expect(spy).toHaveBeenCalled();
      expect(result).toBe('data');
    });
  });

  describe('extractTasksFromClasses', () => {
    it('should extract tasks from multiple classes', () => {
      const testInstance1 = new TestTaskClass();
      const testInstance2 = new TestTaskClass();

      // Mock the reflector to return metadata for all decorated methods
      (reflector.get as jest.Mock).mockImplementation((key, target) => {
        if (key === 'workflow:task') {
          if (
            target === testInstance1.fetchData ||
            target === testInstance2.fetchData
          ) {
            return {
              id: 'fetchData',
              retries: 2,
              timeoutMs: 1000,
              description: 'Fetch data from API',
            };
          }
          if (
            target === testInstance1.processData ||
            target === testInstance2.processData
          ) {
            return {
              id: 'processData',
              dependencies: ['fetchData'],
              retries: 1,
              description: 'Process the fetched data',
            };
          }
          if (
            target === testInstance1.saveData ||
            target === testInstance2.saveData
          ) {
            return {
              id: 'saveData',
              dependencies: ['processData'],
              description: 'Save processed result to database',
            };
          }
        }
        return undefined;
      });

      const tasks = service.extractTasksFromClasses([
        testInstance1,
        testInstance2,
      ]);

      expect(tasks).toHaveLength(6); // 3 tasks per class
    });

    it('should return empty array for empty input', () => {
      const tasks = service.extractTasksFromClasses([]);
      expect(tasks).toHaveLength(0);
    });
  });
});
