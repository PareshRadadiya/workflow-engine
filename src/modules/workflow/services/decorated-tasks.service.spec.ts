import { Test, TestingModule } from '@nestjs/testing';
import { DecoratedTasksService } from './decorated-tasks.service';
import { TaskExtractorService } from '../services/task-extractor.service';

describe('DecoratedTasksService', () => {
  let service: DecoratedTasksService;
  let taskExtractor: TaskExtractorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DecoratedTasksService, TaskExtractorService],
    }).compile();

    service = module.get<DecoratedTasksService>(DecoratedTasksService);
    taskExtractor = module.get<TaskExtractorService>(TaskExtractorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have decorated methods', () => {
    const tasks = taskExtractor.extractTasksFromClass(service);

    expect(tasks).toHaveLength(5); // fetchData, processData, saveResult, validateData, generateReport

    const taskIds = tasks.map((task) => task.id);
    expect(taskIds).toContain('fetchData');
    expect(taskIds).toContain('processData');
    expect(taskIds).toContain('saveResult');
    expect(taskIds).toContain('validateData');
    expect(taskIds).toContain('generateReport');
  });

  it('should execute fetchData task', async () => {
    const result = await service.fetchData();

    expect(result).toEqual({
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
    });
  });

  it('should execute processData task', async () => {
    const result = await service.processData();

    expect(result).toEqual({
      processed: true,
      count: 2,
    });
  });

  it('should execute saveResult task', async () => {
    const result = await service.saveResult();

    expect(result).toHaveProperty('saved', true);
    expect(result).toHaveProperty('timestamp');
    expect(typeof result.timestamp).toBe('string');
  });

  it('should execute validateData task', async () => {
    const result = await service.validateData();

    expect(result).toEqual({
      valid: true,
      validationErrors: [],
    });
  });

  it('should execute generateReport task', async () => {
    const result = await service.generateReport();

    expect(result).toHaveProperty('report', 'Monthly Summary Report');
    expect(result).toHaveProperty('generatedAt');
    expect(typeof result.generatedAt).toBe('string');
  });

  it('should have correct task metadata', () => {
    const tasks = taskExtractor.extractTasksFromClass(service);

    const fetchDataTask = tasks.find((task) => task.id === 'fetchData');
    expect(fetchDataTask?.retries).toBe(2);
    expect(fetchDataTask?.timeoutMs).toBe(1000);
    expect(fetchDataTask?.description).toBe('Fetch data from remote API');

    const processDataTask = tasks.find((task) => task.id === 'processData');
    expect(processDataTask?.dependencies).toEqual(['fetchData']);
    expect(processDataTask?.retries).toBe(1);
    expect(processDataTask?.timeoutMs).toBe(500);

    const saveResultTask = tasks.find((task) => task.id === 'saveResult');
    expect(saveResultTask?.dependencies).toEqual(['processData']);
    expect(saveResultTask?.retries).toBeUndefined(); // Uses default
    expect(saveResultTask?.timeoutMs).toBeUndefined(); // Uses default
  });

  it('should simulate delays correctly', async () => {
    const startTime = Date.now();

    await service.fetchData();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should take at least 100ms (the simulated delay)
    expect(duration).toBeGreaterThanOrEqual(90);
  })
});
