import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { NavigationModule } from './navigation/navigation.module';

/**
 * Identity & Access Management bounded context.
 * Owns authentication, users, roles and the permissions catalog —
 * everything that answers "who is this and what can they do".
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    NavigationModule,
  ],
  exports: [AuthModule, UsersModule],
})
export class IamContextModule {}
