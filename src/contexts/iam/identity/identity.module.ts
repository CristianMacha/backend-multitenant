import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { IdentityController } from './presentation/controllers/identity.controller';
import { GetMyIdentityHandler } from './application/get-my-identity/get-my-identity.handler';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [IdentityController],
  providers: [GetMyIdentityHandler],
})
export class IdentityModule {}
