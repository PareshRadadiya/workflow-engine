import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowEngineService } from './workflow-engine.service';
import { TaskExtractorService } from './task-extractor.service';
import { ExampleTasksService } from './example-tasks.service';
import { WorkflowResult } from './task.interface';
import { TestUtils } from './test-utils';
import { WorkflowResponseInterceptor } from './interceptors/workflow-response.interceptor';

@ApiTags('workflow')
@Controller('workflow')
@UseInterceptors(WorkflowResponseInterceptor)
export class WorkflowController {
  constructor(
    private readonly workflowEngine: WorkflowEngineService,
    private readonly taskExtractor: TaskExtractorService,
    private readonly exampleTasksService: ExampleTasksService,
  ) {}

  @Post('run-simple')
  @ApiOperation({ summary: 'Run simple workflow' })
  async runSimpleWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createSimpleWorkflow());
  }

  @Post('run-dependencies')
  @ApiOperation({ summary: 'Run workflow with dependencies' })
  async runDependencyWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createDependencyWorkflow());
  }

  @Post('run-parallel')
  @ApiOperation({ summary: 'Run parallel workflow' })
  async runParallelWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createParallelWorkflow());
  }

  @Post('run-retry')
  @ApiOperation({ summary: 'Run workflow with retries' })
  async runRetryWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createRetryWorkflow());
  }

  @Post('run-decorated')
  @ApiOperation({ summary: 'Run decorated workflow' })
  async runDecoratedWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(
      this.taskExtractor.extractTasksFromClass(this.exampleTasksService),
    );
  }
}
