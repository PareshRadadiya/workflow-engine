import { TaskDefinition } from './task.interface';

/**
 * Tracks the execution state of tasks in a workflow
 * Manages completed, in-progress, and ready tasks
 */
export class TaskStateTracker {
  private completed = new Set<string>();
  private inProgress = new Set<string>();

  /**
   * Marks a task as in progress
   * @param taskId The ID of the task to mark as in progress
   */
  markInProgress(taskId: string): void {
    this.inProgress.add(taskId);
  }

  /**
   * Marks a task as completed
   * @param taskId The ID of the task to mark as completed
   */
  markCompleted(taskId: string): void {
    this.inProgress.delete(taskId);
    this.completed.add(taskId);
  }

  /**
   * Checks if a task is completed
   * @param taskId The ID of the task to check
   * @returns true if the task is completed
   */
  isCompleted(taskId: string): boolean {
    return this.completed.has(taskId);
  }

  /**
   * Checks if a task is currently in progress
   * @param taskId The ID of the task to check
   * @returns true if the task is in progress
   */
  isInProgress(taskId: string): boolean {
    return this.inProgress.has(taskId);
  }

  /**
   * Checks if a task is ready to be executed
   * A task is ready if it's not completed, not in progress, and all dependencies are completed
   * @param task The task definition to check
   * @returns true if the task is ready to execute
   */
  isReady(task: TaskDefinition): boolean {
    if (this.isCompleted(task.id) || this.isInProgress(task.id)) {
      return false;
    }

    if (!task.dependencies) {
      return true;
    }

    return task.dependencies.every((dep) => this.completed.has(dep));
  }

  /**
   * Gets all tasks that are ready to be executed
   * @param workflow Array of all task definitions
   * @returns Array of tasks that are ready to execute
   */
  getPending(workflow: TaskDefinition[]): TaskDefinition[] {
    return workflow.filter((task) => this.isReady(task));
  }

  /**
   * Gets all tasks that have not been completed yet
   * @param workflow Array of all task definitions
   * @returns Array of tasks that are not completed
   */
  getRemaining(workflow: TaskDefinition[]): TaskDefinition[] {
    return workflow.filter((task) => !this.completed.has(task.id));
  }

  /**
   * Checks if all tasks in the workflow have been completed
   * @param total Total number of tasks in the workflow
   * @returns true if all tasks are completed
   */
  isAllCompleted(total: number): boolean {
    return this.completed.size === total;
  }

  /**
   * Gets the number of completed tasks
   * @returns Number of completed tasks
   */
  getCompletedCount(): number {
    return this.completed.size;
  }

  /**
   * Gets the number of tasks currently in progress
   * @returns Number of tasks in progress
   */
  getInProgressCount(): number {
    return this.inProgress.size;
  }

  /**
   * Gets all completed task IDs
   * @returns Array of completed task IDs
   */
  getCompletedTaskIds(): string[] {
    return Array.from(this.completed);
  }

  /**
   * Gets all in-progress task IDs
   * @returns Array of in-progress task IDs
   */
  getInProgressTaskIds(): string[] {
    return Array.from(this.inProgress);
  }

  /**
   * Resets the tracker state (useful for testing)
   */
  reset(): void {
    this.completed.clear();
    this.inProgress.clear();
  }

  /**
   * Gets a summary of the current state
   * @returns Object with completion statistics
   */
  getStateSummary(): {
    completed: number;
    inProgress: number;
    completedTaskIds: string[];
    inProgressTaskIds: string[];
  } {
    return {
      completed: this.getCompletedCount(),
      inProgress: this.getInProgressCount(),
      completedTaskIds: this.getCompletedTaskIds(),
      inProgressTaskIds: this.getInProgressTaskIds(),
    };
  }
}
