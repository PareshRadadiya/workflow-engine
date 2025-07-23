import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WorkflowEngineService } from '@workflow//services/workflow-engine.service';
import { RetryHandlerService } from '@workflow/services/retry-handler.service';
import { TaskExtractorService } from '../workflow/services/task-extractor.service';
import { WorkflowController } from '@workflow/workflow.controller';
import { DecoratedTasksService } from '@workflow/services/decorated-tasks.service';
import { ValidatorService } from '@workflow/services/validator.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [WorkflowController],
  providers: [
    WorkflowEngineService,    // Core workflow execution engine
    ValidatorService,         // Workflow validation and dependency checking
    RetryHandlerService,      // Task retry logic with backoff strategies
    TaskExtractorService,     // Decorator metadata extraction
    DecoratedTasksService,    // Management of decorated task services
  ],
  exports: [
    WorkflowEngineService,
    ValidatorService,
    RetryHandlerService,
    TaskExtractorService,
    DecoratedTasksService,
  ],
})
export class WorkflowModule {}
