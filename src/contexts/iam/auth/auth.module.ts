import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { firebaseAdminProvider } from './infrastructure/firebase/firebase-admin.provider';
import { FirebaseJwtStrategy } from './infrastructure/strategies/firebase-jwt.strategy';
import { UserContextService } from './application/user-context.service';
import { FirebaseAuthGuard } from './presentation/guards/firebase-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { PermissionsGuard } from './presentation/guards/permissions.guard';
import { TenantGuard } from './presentation/guards/tenant.guard';

@Module({
  imports: [PassportModule],
  providers: [
    firebaseAdminProvider,
    FirebaseJwtStrategy,
    UserContextService,
    FirebaseAuthGuard,
    RolesGuard,
    PermissionsGuard,
    TenantGuard,
  ],
  exports: [
    UserContextService,
    FirebaseAuthGuard,
    RolesGuard,
    PermissionsGuard,
    TenantGuard,
  ],
})
export class AuthModule {}
