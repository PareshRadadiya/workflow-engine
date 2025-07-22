import { Injectable } from '@nestjs/common';
import { TaskDefinition } from './task.interface';
import { VALIDATION_ERRORS } from './constants';

@Injectable()
export class WorkflowValidatorService {
  /**
   * Validates a workflow definition for correctness
   * @param workflow Array of task definitions to validate
   * @throws Error if validation fails
   */
  validateWorkflow(workflow: TaskDefinition[]): void {
    this.validateTaskIds(workflow);
    this.validateDependencies(workflow);
    this.validateCircularDependencies(workflow);
  }

  /**
   * Validates that all task IDs are unique
   * @param workflow Array of task definitions
   * @throws Error if duplicate task IDs are found
   */
  private validateTaskIds(workflow: TaskDefinition[]): void {
    const taskIds = new Set(workflow.map((task) => task.id));

    if (taskIds.size !== workflow.length) {
      throw new Error(VALIDATION_ERRORS.DUPLICATE_TASK_IDS);
    }
  }

  /**
   * Validates that all dependencies reference existing tasks
   * @param workflow Array of task definitions
   * @throws Error if non-existent dependencies are found
   */
  private validateDependencies(workflow: TaskDefinition[]): void {
    const taskIds = new Set(workflow.map((task) => task.id));

    for (const task of workflow) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          if (!taskIds.has(depId)) {
            throw new Error(
              VALIDATION_ERRORS.NON_EXISTENT_DEPENDENCY(task.id, depId),
            );
          }
        }
      }
    }
  }

  /**
   * Validates that there are no circular dependencies in the workflow
   * @param workflow Array of task definitions
   * @throws Error if circular dependencies are detected
   */
  private validateCircularDependencies(workflow: TaskDefinition[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const task of workflow) {
      if (!visited.has(task.id)) {
        if (
          this.hasCircularDependency(task.id, workflow, visited, recursionStack)
        ) {
          throw new Error(VALIDATION_ERRORS.CIRCULAR_DEPENDENCY(task.id));
        }
      }
    }
  }

  /**
   * Checks for circular dependencies using depth-first search
   * @param taskId Current task ID being checked
   * @param workflow Array of all task definitions
   * @param visited Set of visited task IDs
   * @param recursionStack Set of task IDs in current recursion stack
   * @returns true if circular dependency is found
   */
  private hasCircularDependency(
    taskId: string,
    workflow: TaskDefinition[],
    visited: Set<string>,
    recursionStack: Set<string>,
  ): boolean {
    visited.add(taskId);
    recursionStack.add(taskId);

    const task = workflow.find((t) => t.id === taskId);
    if (task?.dependencies) {
      for (const depId of task.dependencies) {
        if (!visited.has(depId)) {
          if (
            this.hasCircularDependency(depId, workflow, visited, recursionStack)
          ) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  /**
   * Gets all task IDs that a given task depends on (transitive dependencies)
   * @param taskId The task ID to get dependencies for
   * @param workflow Array of all task definitions
   * @returns Set of all dependency task IDs (including transitive)
   */
  getTransitiveDependencies(
    taskId: string,
    workflow: TaskDefinition[],
  ): Set<string> {
    const dependencies = new Set<string>();
    const visited = new Set<string>();

    this.collectDependencies(taskId, workflow, dependencies, visited);
    return dependencies;
  }

  /**
   * Recursively collects all dependencies for a task
   * @param taskId Current task ID
   * @param workflow Array of all task definitions
   * @param dependencies Set to collect dependencies in
   * @param visited Set of visited task IDs to prevent cycles
   */
  private collectDependencies(
    taskId: string,
    workflow: TaskDefinition[],
    dependencies: Set<string>,
    visited: Set<string>,
  ): void {
    if (visited.has(taskId)) {
      return;
    }

    visited.add(taskId);
    const task = workflow.find((t) => t.id === taskId);

    if (task?.dependencies) {
      for (const depId of task.dependencies) {
        dependencies.add(depId);
        this.collectDependencies(depId, workflow, dependencies, visited);
      }
    }
  }

  /**
   * Gets the execution order for tasks based on dependencies
   * @param workflow Array of task definitions
   * @returns Array of task IDs in execution order
   */
  getExecutionOrder(workflow: TaskDefinition[]): string[] {
    const executionOrder: string[] = [];
    const visited = new Set<string>();
    const tempVisited = new Set<string>();

    for (const task of workflow) {
      if (!visited.has(task.id)) {
        this.topologicalSort(
          task.id,
          workflow,
          executionOrder,
          visited,
          tempVisited,
        );
      }
    }

    return executionOrder;
  }

  /**
   * Performs topological sort to determine execution order
   * @param taskId Current task ID
   * @param workflow Array of all task definitions
   * @param executionOrder Array to collect execution order
   * @param visited Set of permanently visited task IDs
   * @param tempVisited Set of temporarily visited task IDs (for cycle detection)
   */
  private topologicalSort(
    taskId: string,
    workflow: TaskDefinition[],
    executionOrder: string[],
    visited: Set<string>,
    tempVisited: Set<string>,
  ): void {
    if (tempVisited.has(taskId)) {
      throw new Error(VALIDATION_ERRORS.CIRCULAR_DEPENDENCY(taskId));
    }

    if (visited.has(taskId)) {
      return;
    }

    tempVisited.add(taskId);

    const task = workflow.find((t) => t.id === taskId);
    if (task?.dependencies) {
      for (const depId of task.dependencies) {
        this.topologicalSort(
          depId,
          workflow,
          executionOrder,
          visited,
          tempVisited,
        );
      }
    }

    tempVisited.delete(taskId);
    visited.add(taskId);
    executionOrder.push(taskId);
  }

  /**
   * Validates individual task configuration
   * @param task Task definition to validate
   * @throws Error if task configuration is invalid
   */
  validateTask(task: TaskDefinition): void {
    if (!task.id || task.id.trim() === '') {
      throw new Error(VALIDATION_ERRORS.EMPTY_TASK_ID);
    }

    if (typeof task.handler !== 'function') {
      throw new Error(VALIDATION_ERRORS.INVALID_HANDLER(task.id));
    }

    if (
      task.retries !== undefined &&
      (task.retries < 0 || !Number.isInteger(task.retries))
    ) {
      throw new Error(VALIDATION_ERRORS.INVALID_RETRIES(task.id));
    }

    if (
      task.timeoutMs !== undefined &&
      (task.timeoutMs <= 0 || !Number.isInteger(task.timeoutMs))
    ) {
      throw new Error(VALIDATION_ERRORS.INVALID_TIMEOUT(task.id));
    }

    if (task.dependencies && !Array.isArray(task.dependencies)) {
      throw new Error(VALIDATION_ERRORS.INVALID_DEPENDENCIES(task.id));
    }

    if (task.dependencies) {
      for (const depId of task.dependencies) {
        if (typeof depId !== 'string' || depId.trim() === '') {
          throw new Error(
            VALIDATION_ERRORS.INVALID_DEPENDENCY_ID(task.id, depId),
          );
        }
        if (depId === task.id) {
          throw new Error(VALIDATION_ERRORS.SELF_DEPENDENCY(task.id));
        }
      }
    }
  }
}
