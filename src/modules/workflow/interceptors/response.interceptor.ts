import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorkflowResult } from '@workflow/interfaces/task.interface';

export interface WorkflowApiResponse {
  success: boolean;
  results: Record<string, {
    id: string;
    success: boolean;
    data: any;
    error?: string;
    duration: number;
    retryCount: number;
    attempts: number;
  }>;
  duration: number;
  errors: string[];
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor<WorkflowResult, WorkflowApiResponse> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<WorkflowApiResponse> {
    return next.handle().pipe(
      map((result: WorkflowResult) => this.transformToApiFormat(result)),
    );
  }

  private transformToApiFormat(result: WorkflowResult): WorkflowApiResponse {
    const resultsRecord: Record<string, any> = {};
    
    result.results.forEach((value: any, key: string) => {
      resultsRecord[key] = {
        id: value.id,
        success: value.success,
        data: value.data,
        error: value.error?.message,
        duration: value.duration,
        retryCount: value.retryCount,
        attempts: value.attempts,
      };
    });

    return {
      success: result.success,
      results: resultsRecord,
      duration: result.duration,
      errors: result.errors.map((error: Error) => error.message),
    };
  }
} 