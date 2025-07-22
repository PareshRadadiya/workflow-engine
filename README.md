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
