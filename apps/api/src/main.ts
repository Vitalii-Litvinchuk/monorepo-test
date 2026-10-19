import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from root and/or local api directory before initializing Nest
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../.env'),
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createPipelineValidationPipe } from './common/pipes/validation.pipe';
import { ProblemDetailsExceptionFilter } from './common/filters/problem-details-exception.filter';
import { runSeed } from './database/seed';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix for REST API
  app.setGlobalPrefix('api', {
    exclude: ['static/(.*)', 'graphql'],
  });

  // Pipeline-first validation (C# style, before entering controller handler)
  app.useGlobalPipes(createPipelineValidationPipe());

  // RFC 7807 ProblemDetails standard error filter
  app.useGlobalFilters(new ProblemDetailsExceptionFilter());

  // Auto seed initial data if database is empty
  const dataSource = app.get(DataSource);
  await runSeed(dataSource);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend API running on http://localhost:${port}/api`);
  console.log(`Static assets served on http://localhost:${port}/static/`);
  console.log(`GraphQL playground on http://localhost:${port}/graphql`);
}

bootstrap();
