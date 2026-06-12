import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository';
import { PrismaRoleRepository } from './infrastructure/repositories/prisma-role.repository';
import { RolesController } from './presentation/controllers/roles.controller';
import {
  CreateRoleHandler,
  DeleteRoleHandler,
  GetRoleByIdHandler,
  GetRolesHandler,
  SetRolePermissionsHandler,
  UpdateRoleHandler,
} from './application/handlers/role.handlers';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [RolesController],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    CreateRoleHandler,
    UpdateRoleHandler,
    DeleteRoleHandler,
    SetRolePermissionsHandler,
    GetRoleByIdHandler,
    GetRolesHandler,
  ],
})
export class RolesModule {}
