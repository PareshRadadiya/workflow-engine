import { Injectable } from '@nestjs/common';
import { TaskStep } from './task.decorator';

/**
 * Example task service demonstrating decorator usage
 * This service is injectable and can be used in controllers and other services
 */
@Injectable()
export class ExampleTasksService {
  /**
   * Simulates a task with a delay and returns the specified result
   * @param delay Delay in milliseconds
   * @param result Result to return
   * @returns Promise that resolves to the result after the delay
   */
  private async simulateTask(delay: number, result: any) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return result;
  }

  @TaskStep({
    id: 'fetchData',
    retries: 2,
    timeoutMs: 1000,
    description: 'Fetch data from remote API',
  })
  async fetchData() {
    return await this.simulateTask(100, {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
    });
  }

  @TaskStep({
    id: 'processData',
    dependencies: ['fetchData'],
    retries: 1,
    timeoutMs: 500,
    description: 'Process the fetched data',
  })
  async processData() {
    return await this.simulateTask(50, { processed: true, count: 2 });
  }

  @TaskStep({
    id: 'saveResult',
    dependencies: ['processData'],
    description: 'Save processed result to database',
  })
  async saveResult() {
    return await this.simulateTask(75, {
      saved: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Additional example task for demonstration
   */
  @TaskStep({
    id: 'validateData',
    dependencies: ['fetchData'],
    retries: 1,
    timeoutMs: 300,
    description: 'Validate fetched data',
  })
  async validateData() {
    return await this.simulateTask(30, {
      valid: true,
      validationErrors: [],
    });
  }

  /**
   * Example task that can be used independently
   */
  @TaskStep({
    id: 'generateReport',
    retries: 0,
    timeoutMs: 2000,
    description: 'Generate summary report',
  })
  async generateReport() {
    return await this.simulateTask(150, {
      report: 'Monthly Summary Report',
      generatedAt: new Date().toISOString(),
    });
  }
}
