export interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  swaggerEnabled: boolean;
  corsOrigin: string[];
  rateLimit: { ttl: number; limit: number };
  database: { url: string };
  redis: { host: string; port: number; password?: string };
  firebase: { projectId: string; clientEmail: string; privateKey: string };
  jwt: { audience: string; issuer: string };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
  corsOrigin: (process.env.CORS_ORIGIN ?? '*')
    .split(',')
    .map((origin) => origin.trim()),
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT ?? '100', 10),
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },
  jwt: {
    audience: process.env.JWT_AUDIENCE ?? '',
    issuer: process.env.JWT_ISSUER ?? '',
  },
});
