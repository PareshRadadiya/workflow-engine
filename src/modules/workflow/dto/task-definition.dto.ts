import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class TaskDefinitionDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];

  @IsOptional()
  @IsNumber()
  retries?: number;

  @IsOptional()
  @IsNumber()
  timeoutMs?: number;
}

