import fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { getMfaEncryptionKey } from './lib/crypto';
import { authRoutes } from './modules/auth/auth.routes';
import {
  AuthService,
  getAccessTokenTtl,
  getMfaSessionTokenTtl,
  getRefreshTokenTtl,
  type JwtTokenPayload,
} from './modules/auth/auth.service';
import { mfaRoutes } from './modules/auth/mfa.routes';
import { MfaService } from './modules/auth/mfa.service';

export interface BuildAppOptions {
  prisma?: PrismaClient;
  authService?: AuthService;
  mfaService?: MfaService;
  jwtSecret?: string;
  mfaSessionSecret?: string;
  mfaEncryptionKey?: Buffer;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = fastify({ logger: true });
  const prisma = options.prisma ?? new PrismaClient();
  const jwtSecret = options.jwtSecret ?? process.env.JWT_SECRET;
  const mfaSessionSecret = options.mfaSessionSecret ?? process.env.MFA_SESSION_SECRET;
  const mfaEncryptionKey = options.mfaEncryptionKey ?? getMfaEncryptionKey();
  if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');
  if (!mfaSessionSecret) throw new Error('MFA_SESSION_SECRET environment variable is required');

  app.decorate('prisma', prisma);

  await app.register(cors);
  await app.register(helmet);
  await app.register(rateLimit);
  await app.register(jwt, { secret: jwtSecret });

  const jwtSigner = {
    signAccessToken: async (payload: JwtTokenPayload) => app.jwt.sign(payload, { expiresIn: getAccessTokenTtl() }),
    signRefreshToken: async (payload: JwtTokenPayload) => app.jwt.sign(payload, { expiresIn: getRefreshTokenTtl() }),
    signMfaSessionToken: async (payload: JwtTokenPayload) =>
      app.jwt.sign(payload, { key: mfaSessionSecret, expiresIn: getMfaSessionTokenTtl() }),
    verifyRefreshToken: async (token: string) => app.jwt.verify<JwtTokenPayload>(token),
    verifyMfaSessionToken: async (token: string) =>
      app.jwt.verify<JwtTokenPayload>(token, { key: mfaSessionSecret }),
  };
  const authService = options.authService ?? new AuthService({
    prisma,
    jwtSigner,
  });
  const mfaService = options.mfaService ?? new MfaService({ prisma, jwtSigner, encryptionKey: mfaEncryptionKey });

  app.decorate('authService', authService);
  app.decorate('mfaService', mfaService);
  await app.register(authRoutes);
  await app.register(mfaRoutes);

  app.get('/health', async () => ({ status: 'ok', service: 'backend' }));

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authService: AuthService;
    mfaService: MfaService;
  }
}
