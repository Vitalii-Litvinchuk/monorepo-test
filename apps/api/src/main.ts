import './common/env';

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

  // Fixed non-root API base path from settings (defaults to /test-api)
  const apiBasePath = (process.env.API_BASE_PATH || '/test-api').replace(/\/+$/, '');
  if (apiBasePath && apiBasePath !== '/') {
    const cleanPrefix = apiBasePath.startsWith('/') ? apiBasePath : `/${apiBasePath}`;

    // Express middleware to strip configured base path from incoming HTTP requests
    app.use((req: any, _res: any, next: any) => {
      if (req?.url && req.url.startsWith(cleanPrefix)) {
        req.url = req.url.slice(cleanPrefix.length) || '/';
      }
      next();
    });

    // Strip configured base path for WebSocket upgrades
    const httpServer = app.getHttpServer();
    if (httpServer) {
      httpServer.prependListener('upgrade', (req: any) => {
        if (req?.url && req.url.startsWith(cleanPrefix)) {
          req.url = req.url.slice(cleanPrefix.length) || '/';
        }
      });
    }
  }

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
  console.log(`Backend API running on http://localhost:${port}/api (subpath: ${apiBasePath})`);
  console.log(`Static assets served on http://localhost:${port}/static/`);
  console.log(`GraphQL playground on http://localhost:${port}/graphql`);
}

bootstrap();
