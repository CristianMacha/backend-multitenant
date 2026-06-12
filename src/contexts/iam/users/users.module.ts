import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UsersController } from './presentation/controllers/users.controller';
import { CreateUserHandler } from './application/handlers/create-user.handler';
import { UpdateUserHandler } from './application/handlers/update-user.handler';
import { DeleteUserHandler } from './application/handlers/delete-user.handler';
import { AssignRoleHandler } from './application/handlers/assign-role.handler';
import { GetUserByIdHandler } from './application/handlers/get-user-by-id.handler';
import { GetUsersHandler } from './application/handlers/get-users.handler';
import { InvalidateUserCacheHandler } from './application/event-handlers/invalidate-user-cache.handler';

const commandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  AssignRoleHandler,
];
const queryHandlers = [GetUserByIdHandler, GetUsersHandler];
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
