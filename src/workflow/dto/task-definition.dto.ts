import { Expose, Transform } from 'class-transformer';

/**
 * DTO for task definition in API responses
 * Uses class-transformer for clean serialization
 */
export class TaskDefinitionDto {
  @Expose() id: string;
  
  @Expose() 
  @Transform(({ value }) => value.toString()) 
  handler: any;
  
  @Expose() dependencies?: string[];
  
  @Expose() retries?: number;
  
  @Expose() timeoutMs?: number;
  
  @Expose() description?: string;
} 