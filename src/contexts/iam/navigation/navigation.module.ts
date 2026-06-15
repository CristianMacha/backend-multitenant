import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { NavigationController } from './presentation/controllers/navigation.controller';
import { GetNavigationHandler } from './application/get-navigation/get-navigation.handler';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [NavigationController],
  providers: [GetNavigationHandler],
})
export class NavigationModule {}
