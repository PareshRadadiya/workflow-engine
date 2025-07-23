import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { WorkflowEngineService } from '@workflow/services/workflow-engine.service';
import { TaskExtractorService } from '@workflow/services/task-extractor.service';
import { DecoratedTasksService } from '@workflow/services/decorated-tasks.service';
import { WorkflowResult } from '@workflow/interfaces/task.interface';
import { TestUtils } from '@workflow/utils/test-utils';
import { ExecuteWorkflowDto } from '@workflow/dto/execute-workflow.dto';


@ApiTags('workflow')
@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly workflowEngine: WorkflowEngineService,
    private readonly taskExtractor: TaskExtractorService,
    private readonly exampleTasksService: DecoratedTasksService,
  ) { }

  // GET - These are predefined workflows, no input needed
  @Get('run-simple')
  @ApiOperation({ summary: 'Run simple workflow' })
  async runSimpleWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createSimpleWorkflow());
  }

  @Get('run-dependencies')
  @ApiOperation({ summary: 'Run workflow with dependencies' })
  async runDependencyWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createDependencyWorkflow());
  }

  @Get('run-parallel')
  @ApiOperation({ summary: 'Run parallel workflow' })
  async runParallelWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createParallelWorkflow());
  }

  @Get('run-retry')
  @ApiOperation({ summary: 'Run workflow with retries' })
  async runRetryWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(TestUtils.createRetryWorkflow());
  }

  @Get('run-decorated')
  @ApiOperation({ summary: 'Run decorated workflow' })
  async runDecoratedWorkflow(): Promise<WorkflowResult> {
    return await this.workflowEngine.run(
      this.taskExtractor.extractTasksFromClass(this.exampleTasksService),
    );
  }

  // POST - For custom workflows with user input
  @Post('execute')
  @ApiOperation({ summary: 'Execute custom workflow' })
  @ApiBody({
    description: 'Custom workflow definition',
    schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'fetchData' },
              description: { type: 'string', example: 'Fetch user data' },
              dependencies: { type: 'array', items: { type: 'string' }, example: [] },
              retries: { type: 'number', example: 2 },
              timeoutMs: { type: 'number', example: 5000 }
            }
          }
        },
        context: { type: 'object', example: { userId: 123 } }
      }
    }
  })
  async executeWorkflow(@Body() dto: ExecuteWorkflowDto): Promise<WorkflowResult> {
    const tasks = dto.tasks.map(t => ({
      ...t,
      handler: async () => ({ message: `Task ${t.id} completed` })
    }));
    return this.workflowEngine.run(tasks);
  }
}
