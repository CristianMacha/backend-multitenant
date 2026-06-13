import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { PermissionsController } from './presentation/controllers/permissions.controller';
import { GetPermissionsHandler } from './application/get-permissions/get-permissions.handler';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [PermissionsController],
  providers: [GetPermissionsHandler],
})
export class PermissionsModule {}
