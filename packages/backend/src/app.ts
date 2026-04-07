import fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './modules/auth/auth.routes';
import { AuthService, getAccessTokenTtl, getRefreshTokenTtl } from './modules/auth/auth.service';

export interface BuildAppOptions {
  prisma?: PrismaClient;
  authService?: AuthService;
  jwtSecret?: string;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = fastify({ logger: true });
  const prisma = options.prisma ?? new PrismaClient();
  const jwtSecret = options.jwtSecret ?? process.env.JWT_SECRET ?? 'development-only-secret';

  app.decorate('prisma', prisma);

  await app.register(cors);
  await app.register(helmet);
  await app.register(rateLimit);
  await app.register(jwt, { secret: jwtSecret });

  const authService = options.authService ?? new AuthService({
    prisma,
    jwtSigner: {
      signAccessToken: async (payload) => app.jwt.sign(payload, { expiresIn: getAccessTokenTtl() }),
      signRefreshToken: async (payload) => app.jwt.sign(payload, { expiresIn: getRefreshTokenTtl() }),
      verifyRefreshToken: async (token) =>
        app.jwt.verify<{ sub: string; email: string; type: 'access' | 'refresh' }>(token),
    },
  });

  app.decorate('authService', authService);
  await app.register(authRoutes);

  app.get('/health', async () => ({ status: 'ok', service: 'backend' }));

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authService: AuthService;
  }
}
