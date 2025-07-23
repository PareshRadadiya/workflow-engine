import { SetMetadata } from '@nestjs/common';

export interface TaskMetadata {
  id: string;
  dependencies?: string[];
  retries?: number;
  timeoutMs?: number;
  description?: string;
}

export const TASK_METADATA_KEY = 'workflow:task';

export const TaskStep = (metadata: TaskMetadata) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Store the metadata on the method
    SetMetadata(TASK_METADATA_KEY, metadata)(target, propertyKey, descriptor);

    // Return the original descriptor
    return descriptor;
  };
};
