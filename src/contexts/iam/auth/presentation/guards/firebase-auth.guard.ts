import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { FIREBASE_JWT_STRATEGY } from '../../infrastructure/strategies/firebase-jwt.strategy';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** Global authentication guard. Routes marked with @Public() are skipped. */
@Injectable()
export class FirebaseAuthGuard extends AuthGuard(FIREBASE_JWT_STRATEGY) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
