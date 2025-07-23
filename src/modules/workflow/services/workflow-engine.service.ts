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

  /**
   * Executes a complete workflow with dependency resolution
   * 
   * @param workflow Array of task definitions with dependencies
   * @returns WorkflowResult containing success status, results, and execution metrics
   */
  async run(workflow: TaskDefinition[]): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results = new Map<string, TaskResult>();
    const errors: Error[] = [];

    this.logger.log(LOG_MESSAGES.WORKFLOW_STARTED(workflow.length));
    this.eventEmitter.emit(WorkflowEvent.WORKFLOW_STARTED, {
      taskCount: workflow.length,
    });

    try {
      // Step 1: Validate workflow structure and detect circular dependencies
      this.workflowValidator.validateWorkflow(workflow);

      // Step 2: Create task lookup map for efficient dependency resolution
      const taskMap = new Map<string, TaskDefinition>();
      workflow.forEach((task) => taskMap.set(task.id, task));

      // Step 3: Execute tasks with dependency-aware parallel processing
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

  /**
   * Core execution loop implementing dependency-aware parallel processing
   * 
   * Algorithm:
   * 1. Find all tasks ready to execute (dependencies satisfied)
   * 2. Execute ready tasks in parallel for optimal performance
   * 3. Repeat until all tasks complete or deadlock detected
   * 
   * Deadlock Detection:
   * - If no tasks are ready but incomplete tasks remain, it indicates circular dependencies
   * - This should be prevented by validation, but we detect it here as a safety measure
   * 
   * @param workflow Complete task definitions
   * @param taskMap Quick lookup map for task resolution
   * @param results Accumulator for task results
   * @param errors Accumulator for task errors (doesn't stop execution)
   */
  private async executeTasks(
    workflow: TaskDefinition[],
    taskMap: Map<string, TaskDefinition>,
    results: Map<string, TaskResult>,
    errors: Error[],
  ): Promise<void> {
    const tracker = new TaskStateTracker();

    // Continue until all tasks are complete
    while (!tracker.isAllCompleted(workflow.length)) {
      // Get tasks ready for execution (all dependencies satisfied)
      const readyTasks = tracker.getPending(workflow);

      if (readyTasks.length === 0) {
        // No ready tasks but work remains - deadlock detected
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

      // Execute all ready tasks in parallel for maximum efficiency
      // Each task will be handled independently with its own retry logic
      const executions = readyTasks.map((task) =>
        this.executeTask(task, taskMap, results, errors, tracker),
      );

      await Promise.all(executions);
    }
  }

  /**
   * Executes a single task with comprehensive error handling and state tracking
   * 
   * Task Lifecycle:
   * 1. Mark as in-progress to prevent re-execution
   * 2. Create execution context with retry/timeout settings
   * 3. Delegate to retry handler for fault-tolerant execution
   * 4. Update state tracker and emit appropriate events
   * 5. Store results regardless of success/failure for workflow completion
   * 
   * Note: Task failures don't stop the workflow - other independent tasks continue
   * 
   * @param task Task definition to execute
   * @param taskMap All tasks for dependency resolution (unused here but may be needed for future features)
   * @param results Results accumulator
   * @param errors Error accumulator
   * @param tracker State tracker for dependency management
   */
  private async executeTask(
    task: TaskDefinition,
    taskMap: Map<string, TaskDefinition>,
    results: Map<string, TaskResult>,
    errors: Error[],
    tracker: TaskStateTracker,
  ): Promise<void> {
    // Mark task as in-progress to prevent concurrent execution
    tracker.markInProgress(task.id);

    // Create execution context with retry and timeout configuration
    const context: TaskExecutionContext = {
      taskId: task.id,
      startTime: Date.now(),
      retryCount: 0,
      maxRetries: task.retries ?? this.defaultRetries,
      timeoutMs: task.timeoutMs ?? this.defaultTimeoutMs,
    };

    this.logger.log(LOG_MESSAGES.TASK_STARTED(task.id));
    this.eventEmitter.emit(WorkflowEvent.TASK_STARTED, { taskId: task.id });

    // Delegate to retry handler for fault-tolerant execution
    const retryResult = await this.retryHandler.executeWithRetry(task, context);

    if (retryResult.success) {
      this.logger.log(LOG_MESSAGES.TASK_COMPLETED(task.id));
      this.eventEmitter.emit(WorkflowEvent.TASK_COMPLETED, {
        taskId: task.id,
        duration: retryResult.result!.duration,
        data: retryResult.result!.data,
      });
    } else {
      // Collect errors but don't fail the entire workflow
      // Other independent tasks can still complete successfully
      errors.push(retryResult.error!);
    }

    // Always store result (success or failure) for complete workflow tracking
    results.set(task.id, retryResult.result!);
    
    // Mark as completed to unblock dependent tasks
    tracker.markCompleted(task.id);
  }
}
