import { IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskDefinitionDto } from './task-definition.dto';

export class ExecuteWorkflowDto {
  @IsArray()
  @Type(() => TaskDefinitionDto)
  tasks: TaskDefinitionDto[];

  @IsOptional()
  context?: any;
}
