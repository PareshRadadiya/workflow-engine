import { Controller, Post, Get, UseInterceptors } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { WorkflowEngineService } from './workflow-engine.service';
import { TaskExtractorService } from './task-extractor.service';
import { ExampleTasksService } from './example-tasks.service';
import { WorkflowResult } from './task.interface';
import { TaskDefinitionDto } from './dto/task-definition.dto';
import { TestUtils } from './test-utils';
import { WorkflowResponseInterceptor } from './interceptors/workflow-response.interceptor';

@Controller('workflow')
@UseInterceptors(WorkflowResponseInterceptor)
export class WorkflowController {
  constructor(
    private readonly workflowEngine: WorkflowEngineService,
    private readonly taskExtractor: TaskExtractorService,
    private readonly exampleTasksService: ExampleTasksService,
  ) {}

  @Post('run-simple')
  async runSimpleWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createSimpleWorkflow());
  }

  @Post('run-dependencies')
  async runDependencyWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createDependencyWorkflow());
  }

  @Post('run-parallel')
  async runParallelWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createParallelWorkflow());
  }

  @Post('run-retry')
  async runRetryWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createRetryWorkflow());
  }

  @Post('run-decorated')
  async runDecoratedWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(
      this.taskExtractor.extractTasksFromClass(this.exampleTasksService),
    );
  }
}
