import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const FIREBASE_ADMIN = Symbol('FIREBASE_ADMIN');

export const firebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  inject: [ConfigService],
  useFactory: (config: ConfigService): admin.app.App => {
    if (admin.apps.length > 0) {
      return admin.app();
    }
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.get<string>('firebase.projectId'),
        clientEmail: config.get<string>('firebase.clientEmail'),
        privateKey: config.get<string>('firebase.privateKey'),
      }),
    });
  },
};
