import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  type LoginInput,
  type LogoutInput,
  type RefreshInput,
  type RegisterInput,
} from './auth.schema';
import { AuthError } from './auth.service';

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    message: 'Validation failed',
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/register', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    try {
      const input = registerSchema.parse(request.body) as RegisterInput;
      const result = await app.authService.register(input);
      return reply.status(201).send(result);
    } catch (error: unknown) {
      return handleAuthRouteError(reply, error);
    }
  });

  app.post('/auth/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    try {
      const input = loginSchema.parse(request.body) as LoginInput;
      const result = await app.authService.login(input);
      return reply.status(200).send(result);
    } catch (error: unknown) {
      return handleAuthRouteError(reply, error);
    }
  });

  app.post('/auth/logout', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    try {
      const input = logoutSchema.parse(request.body) as LogoutInput;
      await app.authService.logout(input);
      return reply.status(204).send();
    } catch (error: unknown) {
      return handleAuthRouteError(reply, error);
    }
  });

  app.post('/auth/refresh', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    try {
      const input = refreshSchema.parse(request.body) as RefreshInput;
      const result = await app.authService.refresh(input);
      return reply.status(200).send(result);
    } catch (error: unknown) {
      return handleAuthRouteError(reply, error);
    }
  });
};

function handleAuthRouteError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof ZodError) {
    return sendValidationError(reply, error);
  }

  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  throw error;
}
