import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowValidatorService } from './workflow-validator.service';
import { RetryHandlerService } from './retry-handler.service';
import { TaskExtractorService } from './task-extractor.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowEventListenerService } from './workflow-event-listener.service';
import { ExampleTasksService } from './example-tasks.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [WorkflowController],
  providers: [
    WorkflowEngineService,
    WorkflowValidatorService,
    RetryHandlerService,
    TaskExtractorService,
    WorkflowEventListenerService,
    ExampleTasksService,
  ],
  exports: [
    WorkflowEngineService,
    WorkflowValidatorService,
    RetryHandlerService,
    TaskExtractorService,
    ExampleTasksService,
  ],
})
export class WorkflowModule {}
