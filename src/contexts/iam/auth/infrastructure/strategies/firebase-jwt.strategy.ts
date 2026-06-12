import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import * as admin from 'firebase-admin';
import {
  UserContext,
  RequestContextStorage,
} from '@shared/context/request-context';
import { FIREBASE_ADMIN } from '../firebase/firebase-admin.provider';
import { UserContextService } from '../../application/user-context.service';

export const FIREBASE_JWT_STRATEGY = 'firebase-jwt';

@Injectable()
export class FirebaseJwtStrategy extends PassportStrategy(
  Strategy,
  FIREBASE_JWT_STRATEGY,
) {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebase: admin.app.App,
    private readonly userContextService: UserContextService,
  ) {
    super();
  }

  async validate(req: Request): Promise<UserContext> {
    const token = this.extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await this.firebase.auth().verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userContext = await this.userContextService.buildContext(decoded.uid);
    RequestContextStorage.setUser(userContext);
    return userContext;
  }

  private extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice('Bearer '.length);
  }
}
