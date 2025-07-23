# 🚀 Workflow Engine

A lightweight, in-memory workflow engine built with NestJS that executes tasks with dependencies, retries, timeouts, and parallel execution.

## Features

- ✅ Task dependencies and parallel execution
- ✅ Configurable retries with exponential backoff
- ✅ Task timeouts and error handling
- ✅ Lifecycle events and logging
- ✅ REST API with Swagger documentation
- ✅ Decorator-based task definition (`@TaskStep`)
- ✅ Comprehensive test coverage

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/workflow/run-simple` | Execute simple workflow |
| `POST` | `/workflow/run-dependencies` | Execute workflow with dependencies |
| `POST` | `/workflow/run-parallel` | Execute parallel workflow |
| `POST` | `/workflow/run-retry` | Execute workflow with retries |
| `POST` | `/workflow/run-decorated` | Execute decorated workflow |

**API Documentation**: `http://localhost:3000/api`

## Usage Examples

### Basic Workflow

```typescript
import { WorkflowEngineService } from './workflow/workflow-engine.service';

const workflow = [
  {
    id: 'fetchData',
    handler: async () => ({ users: [{ id: 1, name: 'John' }] }),
    retries: 2,
    timeoutMs: 1000,
  },
  {
    id: 'processData',
    dependencies: ['fetchData'],
    handler: async () => ({ processed: true }),
  },
];

const result = await workflowEngine.run(workflow);
```

### Using Decorators

```typescript
import { Injectable } from '@nestjs/common';
import { TaskStep } from './workflow/task.decorator';

@Injectable()
export class DataTasksService {
  @TaskStep({ id: 'fetchData', retries: 2 })
  async fetchData() {
    return { users: [{ id: 1, name: 'John' }] };
  }

  @TaskStep({ id: 'processData', dependencies: ['fetchData'] })
  async processData() {
    return { processed: true };
  }
}
```

## Project Structure

```
src/workflow/
├── workflow-engine.service.ts      # Core execution engine
├── workflow-validator.service.ts   # Task validation
├── retry-handler.service.ts        # Retry logic
├── task-extractor.service.ts       # Decorator extraction
├── workflow.controller.ts          # REST API
├── interceptors/                   # Response formatting
├── utils/                          # Utility functions
└── *.spec.ts                       # Tests
```

## License

MIT
