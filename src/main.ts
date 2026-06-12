import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.enableShutdownHooks();

  app.use(helmet());
  app.enableCors({
    origin: config.get<string[]>('corsOrigin'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-tenant-id',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  if (config.get<boolean>('swaggerEnabled')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Backend Bear - Enterprise Core API')
      .setDescription(
        'Enterprise Backend Core: multi-tenant, RBAC + permissions, CQRS, event-driven.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addGlobalParameters({
        name: 'x-tenant-id',
        in: 'header',
        required: false,
        schema: { type: 'string', format: 'uuid' },
      })
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  logger.log(
    `API running on http://localhost:${port}/api/v1 (docs at /api/docs)`,
  );
}

void bootstrap();
