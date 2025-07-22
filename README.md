<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# 🚀 Workflow Engine

A lightweight, in-memory workflow engine built with NestJS that executes a series of tasks with dependencies, retries, timeouts, and parallel execution capabilities.

A lightweight, in-memory workflow engine built with NestJS that can execute a series of tasks (steps) with dependencies, support retries, and emit lifecycle events.

## Features

✅ **Core Requirements:**
- Task definition with dependencies
- Workflow execution respecting dependency order
- Configurable retries per task
- Task timeouts enforcement
- State tracking and lifecycle events
- Console logging with timestamps
- Comprehensive unit and integration tests

✅ **Bonus Features:**
- Parallel execution of independent tasks
- Event emitter pattern for external listeners
- Decorator-based task definition (`@TaskStep`)
- REST API endpoints for workflow execution
- OpenAPI/Swagger documentation with interactive UI
- Request/response validation with class-validator
- Event listener service for logging
- Injectable example tasks service with proper lifecycle management
- Task state tracking for better execution management
- Shared constants and error messages for consistency
- Test utilities to eliminate code redundancy
- Clean separation of concerns with focused services

## Installation

```bash
npm install
```

## Usage

### Basic Workflow Definition

```typescript
import { WorkflowEngineService } from './workflow/workflow-engine.service';
import { TaskDefinition } from './workflow/task.interface';

const workflow: TaskDefinition[] = [
  {
    id: 'fetchData',
    handler: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      return { users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] };
    },
    retries: 2,
    timeoutMs: 1000,
    description: 'Fetch data from remote API',
  },
  {
    id: 'processData',
    dependencies: ['fetchData'],
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { processed: true, count: 2 };
    },
    retries: 1,
    timeoutMs: 500,
    description: 'Process the fetched data',
  },
  {
    id: 'saveResult',
    dependencies: ['processData'],
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 75));
      return { saved: true, timestamp: new Date().toISOString() };
    },
    description: 'Save processed result to database',
  },
];

// Execute the workflow
const result = await workflowEngine.run(workflow);
console.log('Workflow completed:', result.success);
```

### Using Decorators

#### Injectable Service Approach (Recommended)

```typescript
import { Injectable } from '@nestjs/common';
import { TaskStep } from './workflow/task.decorator';

@Injectable()
export class DataProcessingTasksService {
  @TaskStep({
    id: 'fetchData',
    retries: 2,
    timeoutMs: 1000,
    description: 'Fetch data from remote API',
  })
  async fetchData() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] };
  }

  @TaskStep({
    id: 'processData',
    dependencies: ['fetchData'],
    retries: 1,
    timeoutMs: 500,
    description: 'Process the fetched data',
  })
  async processData() {
    await new Promise(resolve => setTimeout(resolve, 50));
    return { processed: true, count: 2 };
  }

  @TaskStep({
    id: 'saveResult',
    dependencies: ['processData'],
    description: 'Save processed result to database',
  })
  async saveResult() {
    await new Promise(resolve => setTimeout(resolve, 75));
    return { saved: true, timestamp: new Date().toISOString() };
  }
}

// Inject the service and extract tasks
constructor(
  private readonly taskExtractor: TaskExtractorService,
  private readonly dataProcessingTasks: DataProcessingTasksService,
) {}

async runWorkflow() {
  const tasks = this.taskExtractor.extractTasksFromClass(this.dataProcessingTasks);
  return await this.workflowEngine.run(tasks);
}
```

### REST API Usage

The workflow engine provides simple REST endpoints for workflow execution.

#### Execute Workflows
```bash
# Run a custom workflow
curl -X POST http://localhost:3000/workflow/run \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": "task1",
      "handler": "async () => \"result1\"",
      "retries": 1
    },
    {
      "id": "task2",
      "dependencies": ["task1"],
      "handler": "async () => \"result2\""
    }
  ]'

# Run decorator-based workflow
curl -X POST http://localhost:3000/workflow/run-decorated

# Get example workflow definitions
curl -X GET http://localhost:3000/workflow/examples
```

#### API Response Format
All workflow execution endpoints return a standardized response:

```json
{
  "success": true,
  "results": {
    "taskId": {
      "id": "taskId",
      "success": true,
      "data": "task result",
      "error": null,
      "duration": 150,
      "retryCount": 0
    }
  },
  "duration": 500,
  "errors": []
}
```

## Code Organization & Utilities

### Shared Constants (`constants.ts`)

Centralized constants and error messages to eliminate redundancy:

```typescript
import { WORKFLOW_CONSTANTS, VALIDATION_ERRORS, LOG_MESSAGES } from './workflow/constants';

// Default configuration values
WORKFLOW_CONSTANTS.DEFAULT_TIMEOUT_MS    // 2000ms
WORKFLOW_CONSTANTS.DEFAULT_RETRIES       // 0
WORKFLOW_CONSTANTS.DEFAULT_BASE_DELAY_MS // 100ms

// Predefined error messages
VALIDATION_ERRORS.DUPLICATE_TASK_IDS
VALIDATION_ERRORS.CIRCULAR_DEPENDENCY(taskId)
VALIDATION_ERRORS.NON_EXISTENT_DEPENDENCY(taskId, depId)

// Log message templates
LOG_MESSAGES.WORKFLOW_STARTED(taskCount)
LOG_MESSAGES.TASK_COMPLETED(taskId)
LOG_MESSAGES.TASK_FAILED(taskId, retries, error)
```

### Test Utilities (`test-utils.ts`)

Shared test data and helper functions to eliminate redundant workflow definitions:

```typescript
import { TestUtils } from './workflow/test-utils';

// Predefined test workflows
const simpleWorkflow = TestUtils.createSimpleWorkflow();
const dependencyWorkflow = TestUtils.createDependencyWorkflow();
const parallelWorkflow = TestUtils.createParallelWorkflow();
const retryWorkflow = TestUtils.createRetryWorkflow();
```

### Task State Tracker (`task-state-tracker.ts`)

Manages task execution state and provides utilities for workflow execution:

```typescript
import { TaskStateTracker } from './workflow/task-state-tracker';

const tracker = new TaskStateTracker();

// State management
tracker.markInProgress('task1');
tracker.markCompleted('task1');

// Task readiness checking
const isReady = tracker.isReady(task);
const pendingTasks = tracker.getPending(workflow);
const remainingTasks = tracker.getRemaining(workflow);

// Progress tracking
const isAllCompleted = tracker.isAllCompleted(totalTasks);
const summary = tracker.getStateSummary();
```

### API DTOs (`dto/workflow.dto.ts`)

Data Transfer Objects for API requests and responses with validation:

```typescript
import { TaskDefinition } from './workflow/task.interface';

// Request DTO with validation
const workflowRequest: TaskDefinitionDto[] = [
  {
    id: 'task1',
    handler: 'async () => "result"',
    retries: 2,
    timeoutMs: 1000,
    dependencies: [],
    description: 'Example task'
  }
];

// Response DTO structure
const response: WorkflowResultDto = {
  success: true,
  results: {
    'task1': {
      id: 'task1',
      success: true,
      data: 'result',
      error: null,
      duration: 150,
      retryCount: 0
    }
  },
  duration: 500,
  errors: []
};
```

## API Reference

### TaskDefinition Interface

```typescript
interface TaskDefinition {
  id: string;                           // Unique task identifier
  handler: () => Promise<any>;          // Task execution function
  dependencies?: string[];              // Array of task IDs this task depends on
  retries?: number;                     // Number of retry attempts (default: 0)
  timeoutMs?: number;                   // Task timeout in milliseconds (default: 2000)
  description?: string;                 // Optional task description
}
```

### WorkflowResult Interface

```typescript
interface WorkflowResult {
  success: boolean;                     // Whether the workflow completed successfully
  results: Map<string, TaskResult>;     // Results for each task
  duration: number;                     // Total workflow execution time in ms
  errors: Error[];                      // Array of errors encountered
}
```

### TaskResult Interface

```typescript
interface TaskResult {
  id: string;                           // Task identifier
  success: boolean;                     // Whether the task completed successfully
  data?: any;                           // Task output data
  error?: Error;                        // Error if task failed
  duration: number;                     // Task execution time in ms
  retryCount: number;                   // Number of retry attempts made
}
```

## Lifecycle Events

The workflow engine emits the following events:

- `WORKFLOW_STARTED` - When workflow execution begins
- `WORKFLOW_COMPLETED` - When workflow completes successfully
- `WORKFLOW_FAILED` - When workflow fails
- `TASK_STARTED` - When a task begins execution
- `TASK_COMPLETED` - When a task completes successfully
- `TASK_FAILED` - When a task fails after all retries
- `TASK_RETRY` - When a task is retried

### Event Listener Example

```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowEvent } from './workflow/events.enum';

@Injectable()
export class WorkflowEventListenerService {
  @OnEvent(WorkflowEvent.TASK_COMPLETED)
  handleTaskCompleted(payload: any) {
    console.log(`Task ${payload.taskId} completed in ${payload.duration}ms`);
  }

  @OnEvent(WorkflowEvent.TASK_FAILED)
  handleTaskFailed(payload: any) {
    console.error(`Task ${payload.taskId} failed: ${payload.error}`);
  }
}
```

## Features in Detail

### Parallel Execution

Tasks without dependencies are executed in parallel for better performance:

```typescript
const workflow: TaskDefinition[] = [
  {
    id: 'task1',
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return 'result1';
    },
  },
  {
    id: 'task2',
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return 'result2';
    },
  },
  {
    id: 'task3',
    dependencies: ['task1', 'task2'], // Waits for both task1 and task2
    handler: async () => 'result3',
  },
];
```

### Retry Logic

The `RetryHandlerService` provides sophisticated retry logic with exponential backoff:

```typescript
{
  id: 'unreliableTask',
  handler: async () => {
    // Simulate unreliable operation
    if (Math.random() < 0.5) {
      throw new Error('Random failure');
    }
    return 'success';
  },
  retries: 3, // Will retry up to 3 times
  timeoutMs: 1000,
}
```

#### Retry Handler Features

- **Exponential Backoff**: Automatic delay calculation with configurable base delay
- **Error Classification**: Smart retry decisions based on error types
- **Configurable Timeouts**: Per-task timeout configuration
- **Event Emission**: Retry events for monitoring and logging
- **Flexible Configuration**: Customizable retry strategies

#### Retry Handler Usage

```typescript
import { RetryHandlerService } from './workflow/retry-handler.service';

// Execute task with retry logic
const retryResult = await retryHandler.executeWithRetry(task, context);

// Check if error should be retried
const shouldRetry = retryHandler.shouldRetry(error, ['custom error']);

// Calculate retry delay
const delay = retryHandler.calculateRetryDelay(retryCount, 100, 5000);

// Create retry configuration
const config = retryHandler.createRetryConfig(task);
```

### Dependency Validation

The `WorkflowValidatorService` validates workflow definitions:

- **Duplicate Task IDs**: Ensures each task has a unique identifier
- **Non-existent Dependencies**: Checks that all dependencies reference existing tasks
- **Circular Dependencies**: Detects and prevents circular dependency chains
- **Task Configuration**: Validates individual task properties (retries, timeouts, etc.)
- **Execution Order**: Provides topological sorting for optimal task execution order
- **Transitive Dependencies**: Calculates all dependencies for a given task

#### Validator Service Usage

```typescript
import { WorkflowValidatorService } from './workflow/workflow-validator.service';

// Validate entire workflow
validator.validateWorkflow(workflow);

// Validate individual task
validator.validateTask(task);

// Get execution order
const executionOrder = validator.getExecutionOrder(workflow);

// Get transitive dependencies
const dependencies = validator.getTransitiveDependencies('taskId', workflow);
```

### Timeout Handling

Each task can have a configurable timeout:

```typescript
{
  id: 'slowTask',
  handler: async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    return 'slow result';
  },
  timeoutMs: 1000, // Will timeout after 1 second
}
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

The test suite includes:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test end-to-end workflow execution
- **Error Handling Tests**: Test retry logic, timeouts, and validation
- **Parallel Execution Tests**: Verify concurrent task execution
- **Event System Tests**: Test lifecycle event emission

## Project Structure

```
src/
├── workflow/                           # 🚀 Core workflow engine module
│   ├── workflow.module.ts              # Main workflow module
│   ├── workflow-engine.service.ts      # Core workflow execution engine
│   ├── workflow-validator.service.ts   # Validates tasks and circular dependencies
│   ├── retry-handler.service.ts        # Handles retry logic and exponential backoff
│   ├── task-extractor.service.ts       # Extracts tasks from decorated classes
│   ├── example-tasks.service.ts        # Injectable example tasks with decorators
│   ├── workflow-execution.service.ts   # Workflow execution and response conversion
│   ├── example-workflow.service.ts     # Example workflow management
│   ├── task-state-tracker.ts           # Manages task execution state
│   ├── workflow-event-listener.service.ts # Event listener for logging
│   ├── workflow.controller.ts          # REST API endpoints with Swagger docs
│   ├── dto/
│   │   └── workflow.dto.ts             # API DTOs and validation schemas
│   ├── decorators/
│   │   └── swagger.decorator.ts        # Custom Swagger decorators
│   ├── utils/
│   │   ├── retry-utils.ts              # Retry utility functions
│   │   └── retry-utils.spec.ts         # Retry utility tests
│   ├── task.interface.ts               # TypeScript interfaces
│   ├── events.enum.ts                  # Event type definitions
│   ├── task.decorator.ts               # @TaskStep decorator
│   ├── constants.ts                    # Shared constants and error messages
│   ├── test-utils.ts                   # Test utilities to eliminate redundancy
│   ├── workflow-engine.service.spec.ts # Unit tests
│   ├── workflow-validator.service.spec.ts # Unit tests
│   ├── retry-handler.service.spec.ts   # Unit tests
│   ├── task-extractor.service.spec.ts  # Unit tests
│   ├── example-tasks.service.spec.ts   # Unit tests
│   ├── task-state-tracker.spec.ts      # Unit tests
│   └── workflow.integration.spec.ts    # Integration tests
├── app.module.ts                       # Main application module (clean, minimal)
└── main.ts                            # Application entry point with Swagger config
```

## Error Handling

The workflow engine provides comprehensive error handling:

1. **Task Failures**: Failed tasks are retried according to configuration
2. **Timeouts**: Tasks that exceed their timeout are automatically failed
3. **Dependency Errors**: Invalid dependencies are caught during validation
4. **Circular Dependencies**: Detected and prevented during workflow validation
5. **Graceful Degradation**: Partial failures don't stop the entire workflow

## Performance Considerations

- **In-Memory Execution**: All state is kept in memory for fast execution
- **Parallel Processing**: Independent tasks run concurrently
- **Efficient Dependency Resolution**: Uses topological sorting for optimal execution order
- **Minimal Overhead**: Lightweight implementation with minimal runtime overhead

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
