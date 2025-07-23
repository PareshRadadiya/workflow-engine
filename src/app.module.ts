import { Module } from '@nestjs/common';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [WorkflowModule],
})
export class AppModule {}
