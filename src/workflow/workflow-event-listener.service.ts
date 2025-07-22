import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowEvent } from './events.enum';

@Injectable()
export class WorkflowEventListenerService {
  private readonly logger = new Logger(WorkflowEventListenerService.name);

  @OnEvent(WorkflowEvent.WORKFLOW_STARTED)
  handleWorkflowStarted(payload: any) {
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] WORKFLOW_STARTED - Task count: ${payload.taskCount}`,
    );
  }

  @OnEvent(WorkflowEvent.WORKFLOW_COMPLETED)
  handleWorkflowCompleted(payload: any) {
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] WORKFLOW_COMPLETED - Duration: ${payload.duration}ms`,
    );
  }

  @OnEvent(WorkflowEvent.WORKFLOW_FAILED)
  handleWorkflowFailed(payload: any) {
    const timestamp = new Date().toISOString();
    this.logger.error(
      `[${timestamp}] WORKFLOW_FAILED - Duration: ${payload.duration}ms, Errors: ${payload.errors?.length || 1}`,
    );
  }

  @OnEvent(WorkflowEvent.TASK_STARTED)
  handleTaskStarted(payload: any) {
    const timestamp = new Date().toISOString();
    this.logger.log(`[${timestamp}] TASK_STARTED - Task ID: ${payload.taskId}`);
  }

  @OnEvent(WorkflowEvent.TASK_COMPLETED)
  handleTaskCompleted(payload: any) {
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] TASK_COMPLETED - Task ID: ${payload.taskId}, Duration: ${payload.duration}ms`,
    );
  }

  @OnEvent(WorkflowEvent.TASK_FAILED)
  handleTaskFailed(payload: any) {
    const timestamp = new Date().toISOString();
    this.logger.error(
      `[${timestamp}] TASK_FAILED - Task ID: ${payload.taskId}, Error: ${payload.error}, Retry Count: ${payload.retryCount}`,
    );
  }

  @OnEvent(WorkflowEvent.TASK_RETRY)
  handleTaskRetry(payload: any) {
    const timestamp = new Date().toISOString();
    this.logger.warn(
      `[${timestamp}] TASK_RETRY - Task ID: ${payload.taskId}, Retry Count: ${payload.retryCount}, Error: ${payload.error}`,
    );
  }
}
