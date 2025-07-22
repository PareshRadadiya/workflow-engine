import { Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TaskDefinition } from './task.interface';
import { TASK_METADATA_KEY, TaskMetadata } from './task.decorator';

@Injectable()
export class TaskExtractorService {
  constructor(private readonly reflector: Reflector) {}

  extractTasksFromClass(instance: any): TaskDefinition[] {
    const tasks: TaskDefinition[] = [];
    const prototype = Object.getPrototypeOf(instance);

    // Get all method names from the prototype
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function',
    );

    for (const methodName of methodNames) {
      const metadata = this.reflector.get<TaskMetadata>(
        TASK_METADATA_KEY,
        prototype[methodName],
      );

      if (metadata) {
        tasks.push({
          id: metadata.id,
          handler: () => instance[methodName](),
          dependencies: metadata.dependencies,
          retries: metadata.retries,
          timeoutMs: metadata.timeoutMs,
          description: metadata.description,
        });
      }
    }

    return tasks;
  }

  extractTasksFromClasses(instances: any[]): TaskDefinition[] {
    return instances.flatMap((instance) =>
      this.extractTasksFromClass(instance),
    );
  }
}
