import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { ResponseInterceptor } from '../interceptors/response.interceptor';
import { WorkflowResult, TaskResult } from '../interfaces/task.interface';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor>(ResponseInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform successful workflow result', (done) => {
    const mockWorkflowResult: WorkflowResult = {
      success: true,
      results: new Map([
        ['task1', {
          id: 'task1',
          success: true,
          data: 'result1',
          error: undefined,
          duration: 100,
          retryCount: 0,
          attempts: 1,
        } as TaskResult],
        ['task2', {
          id: 'task2',
          success: true,
          data: 'result2',
          error: undefined,
          duration: 200,
          retryCount: 0,
          attempts: 1,
        } as TaskResult],
      ]),
      duration: 300,
      errors: [],
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as any;

    const mockCallHandler = {
      handle: () => of(mockWorkflowResult),
    } as any;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          results: {
            task1: {
              id: 'task1',
              success: true,
              data: 'result1',
              error: undefined,
              duration: 100,
              retryCount: 0,
              attempts: 1,
            },
            task2: {
              id: 'task2',
              success: true,
              data: 'result2',
              error: undefined,
              duration: 200,
              retryCount: 0,
              attempts: 1,
            },
          },
          duration: 300,
          errors: [],
        });
        done();
      },
      error: done,
    });
  });

  it('should transform failed workflow result with errors', (done) => {
    const mockError = new Error('Task failed');
    const mockWorkflowResult: WorkflowResult = {
      success: false,
      results: new Map([
        ['task1', {
          id: 'task1',
          success: false,
          data: null,
          error: mockError,
          duration: 100,
          retryCount: 2,
          attempts: 3,
        } as TaskResult],
      ]),
      duration: 100,
      errors: [mockError],
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as any;

    const mockCallHandler = {
      handle: () => of(mockWorkflowResult),
    } as any;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: false,
          results: {
            task1: {
              id: 'task1',
              success: false,
              data: null,
              error: 'Task failed',
              duration: 100,
              retryCount: 2,
              attempts: 3,
            },
          },
          duration: 100,
          errors: ['Task failed'],
        });
        done();
      },
      error: done,
    });
  });

  it('should handle empty workflow result', (done) => {
    const mockWorkflowResult: WorkflowResult = {
      success: true,
      results: new Map(),
      duration: 0,
      errors: [],
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as any;

    const mockCallHandler = {
      handle: () => of(mockWorkflowResult),
    } as any;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          results: {},
          duration: 0,
          errors: [],
        });
        done();
      },
      error: done,
    });
  });
}); 