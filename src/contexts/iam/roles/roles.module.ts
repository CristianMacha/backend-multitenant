import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository';
import { PrismaRoleRepository } from './infrastructure/repositories/prisma-role.repository';
import { RolesController } from './presentation/controllers/roles.controller';
import { CreateRoleHandler } from './application/create-role/create-role.handler';
import { UpdateRoleHandler } from './application/update-role/update-role.handler';
import { DeleteRoleHandler } from './application/delete-role/delete-role.handler';
import { SetRolePermissionsHandler } from './application/set-role-permissions/set-role-permissions.handler';
import { GetRolesHandler } from './application/get-roles/get-roles.handler';
import { GetRoleByIdHandler } from './application/get-role-by-id/get-role-by-id.handler';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [RolesController],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    CreateRoleHandler,
    UpdateRoleHandler,
    DeleteRoleHandler,
    SetRolePermissionsHandler,
    GetRolesHandler,
    GetRoleByIdHandler,
  ],
})
export class RolesModule {}
