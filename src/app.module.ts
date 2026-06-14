import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';
import configuration from '@config/configuration';
import { envValidationSchema } from '@config/env.validation';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { GlobalExceptionFilter } from '@shared/presentation/filters/global-exception.filter';
import { ResponseInterceptor } from '@shared/presentation/interceptors/response.interceptor';
import { CorrelationIdMiddleware } from '@shared/presentation/middleware/correlation-id.middleware';
import { TenantMiddleware } from '@shared/presentation/middleware/tenant.middleware';
import { RequestContextStorage } from '@shared/context/request-context';
import { FirebaseAuthGuard } from '@contexts/iam/auth/presentation/guards/firebase-auth.guard';
import { TenantGuard } from '@contexts/iam/auth/presentation/guards/tenant.guard';
import { RolesGuard } from '@contexts/iam/auth/presentation/guards/roles.guard';
import { PermissionsGuard } from '@contexts/iam/auth/presentation/guards/permissions.guard';
import { PlatformAdminGuard } from '@contexts/iam/auth/presentation/guards/platform-admin.guard';
import { IamContextModule } from '@contexts/iam/iam-context.module';
import { TenancyContextModule } from '@contexts/tenancy/tenancy-context.module';
import { AuditContextModule } from '@contexts/audit/audit-context.module';
import { CrmContextModule } from '@contexts/crm/crm-context.module';
import { SalesContextModule } from '@contexts/sales/sales-context.module';
import { CatalogContextModule } from '@contexts/catalog/catalog-context.module';
import { PlatformModule } from '@platform/platform.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('logLevel'),
          genReqId: (req: IncomingMessage) =>
            (req.headers['x-request-id'] as string) ?? randomUUID(),
          customProps: () => ({
            correlationId: RequestContextStorage.getCorrelationId(),
            tenantId: RequestContextStorage.getTenantId(),
          }),
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          transport:
            config.get<string>('nodeEnv') === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: seconds(config.get<number>('rateLimit.ttl') ?? 60),
            limit: config.get<number>('rateLimit.limit') ?? 100,
          },
        ],
      }),
    }),
    PrismaModule,
    PlatformModule,
    IamContextModule,
    TenancyContextModule,
    AuditContextModule,
    CrmContextModule,
    SalesContextModule,
    CatalogContextModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: PlatformAdminGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, TenantMiddleware).forRoutes('*');
  }
}
