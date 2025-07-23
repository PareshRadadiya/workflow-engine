import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TaskDefinition,
  TaskResult,
  TaskExecutionContext,
  WorkflowResult,
} from '../interfaces/task.interface';
import { WorkflowEvent } from '../enums/events.enum';
import { ValidatorService } from './validator.service';
import { RetryHandlerService } from './retry-handler.service';
import {
  WORKFLOW_CONSTANTS,
  LOG_MESSAGES,
} from '../constants/workflow.constants';
import { TaskStateTracker } from '../core/task-state-tracker';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private readonly defaultTimeoutMs = WORKFLOW_CONSTANTS.DEFAULT_TIMEOUT_MS;
  private readonly defaultRetries = WORKFLOW_CONSTANTS.DEFAULT_RETRIES;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly workflowValidator: ValidatorService,
    private readonly retryHandler: RetryHandlerService,
  ) {}

  async run(workflow: TaskDefinition[]): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results = new Map<string, TaskResult>();
    const errors: Error[] = [];

    this.logger.log(LOG_MESSAGES.WORKFLOW_STARTED(workflow.length));
    this.eventEmitter.emit(WorkflowEvent.WORKFLOW_STARTED, {
      taskCount: workflow.length,
    });

    try {
      // Validate workflow
      this.workflowValidator.validateWorkflow(workflow);

      // Create task map for easy lookup
      const taskMap = new Map<string, TaskDefinition>();
      workflow.forEach((task) => taskMap.set(task.id, task));

      // Execute tasks respecting dependencies
      await this.executeTasks(workflow, taskMap, results, errors);

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      if (success) {
        this.logger.log(LOG_MESSAGES.WORKFLOW_COMPLETED(duration));
        this.eventEmitter.emit(WorkflowEvent.WORKFLOW_COMPLETED, {
          duration,
          results,
        });
      } else {
        this.logger.error(
          LOG_MESSAGES.WORKFLOW_FAILED(errors.length, duration),
        );
        this.eventEmitter.emit(WorkflowEvent.WORKFLOW_FAILED, {
          duration,
          errors,
        });
      }

      return {
        success,
        results,
        duration,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(LOG_MESSAGES.WORKFLOW_EXECUTION_FAILED(error.message));
      this.eventEmitter.emit(WorkflowEvent.WORKFLOW_FAILED, {
        duration,
        error,
      });

      return {
        success: false,
        results,
        duration,
        errors: [error],
      };
    }
  }

  private async executeTasks(
    workflow: TaskDefinition[],
    taskMap: Map<string, TaskDefinition>,
    results: Map<string, TaskResult>,
    errors: Error[],
  ): Promise<void> {
    const tracker = new TaskStateTracker();

    while (!tracker.isAllCompleted(workflow.length)) {
      const readyTasks = tracker.getPending(workflow);

      if (readyTasks.length === 0) {
        const remaining = tracker.getRemaining(workflow);
        if (remaining.length > 0) {
          throw new Error(
            LOG_MESSAGES.DEADLOCK_DETECTED(
              remaining.map((t) => t.id).join(', '),
            ),
          );
        }
        break;
      }

      // Execute ready tasks in parallel
      const executions = readyTasks.map((task) =>
        this.executeTask(task, taskMap, results, errors, tracker),
      );

      await Promise.all(executions);
    }
  }

  private async executeTask(
    task: TaskDefinition,
    taskMap: Map<string, TaskDefinition>,
    results: Map<string, TaskResult>,
    errors: Error[],
    tracker: TaskStateTracker,
  ): Promise<void> {
    tracker.markInProgress(task.id);

    const context: TaskExecutionContext = {
      taskId: task.id,
      startTime: Date.now(),
      retryCount: 0,
      maxRetries: task.retries ?? this.defaultRetries,
      timeoutMs: task.timeoutMs ?? this.defaultTimeoutMs,
    };

    this.logger.log(LOG_MESSAGES.TASK_STARTED(task.id));
    this.eventEmitter.emit(WorkflowEvent.TASK_STARTED, { taskId: task.id });

    const retryResult = await this.retryHandler.executeWithRetry(task, context);

    if (retryResult.success) {
      this.logger.log(LOG_MESSAGES.TASK_COMPLETED(task.id));
      this.eventEmitter.emit(WorkflowEvent.TASK_COMPLETED, {
        taskId: task.id,
        duration: retryResult.result!.duration,
        data: retryResult.result!.data,
      });
    } else {
      errors.push(retryResult.error!);
    }

    results.set(task.id, retryResult.result!);
    tracker.markCompleted(task.id);
  }
}
