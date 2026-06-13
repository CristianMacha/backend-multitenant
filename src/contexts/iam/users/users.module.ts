import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UsersController } from './presentation/controllers/users.controller';
import { CreateUserHandler } from './application/create-user/create-user.handler';
import { UpdateUserHandler } from './application/update-user/update-user.handler';
import { DeleteUserHandler } from './application/delete-user/delete-user.handler';
import { AssignRoleHandler } from './application/assign-role/assign-role.handler';
import { GetUsersHandler } from './application/get-users/get-users.handler';
import { GetUserByIdHandler } from './application/get-user-by-id/get-user-by-id.handler';
import { InvalidateUserCacheHandler } from './application/on-user-mutated/invalidate-user-cache.handler';

const commandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  AssignRoleHandler,
];
const queryHandlers = [GetUsersHandler, GetUserByIdHandler];
const eventHandlers = [InvalidateUserCacheHandler];

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
