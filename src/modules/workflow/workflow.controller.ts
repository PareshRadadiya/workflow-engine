import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowEngineService } from '../workflow/services/workflow-engine.service';
import { TaskExtractorService } from '../workflow/services/task-extractor.service';
import { DecoratedTasksService } from '../workflow/services/decorated-tasks.service';
import { WorkflowResult } from '../workflow/interfaces/task.interface';
import { TestUtils } from '../workflow/utils/test-utils';
import { ResponseInterceptor } from '../workflow/interceptors/response.interceptor';


@ApiTags('workflow')
@Controller('workflow')
@UseInterceptors(ResponseInterceptor)
export class WorkflowController {
  constructor(
    private readonly workflowEngine: WorkflowEngineService,
    private readonly taskExtractor: TaskExtractorService,
    private readonly exampleTasksService: DecoratedTasksService,
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
