import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { verifyJwt, type AccessTokenPayload } from '../../middleware/jwt.middleware';
import { AuthError } from './auth.service';
import {
  mfaChallengeSchema,
  mfaDisableSchema,
  mfaVerifySchema,
  type MfaChallengeInput,
  type MfaDisableInput,
  type MfaVerifyInput,
} from './mfa.schema';
import { MfaError } from './mfa.service';

type AuthenticatedRequest = FastifyRequest & { user: AccessTokenPayload };

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    message: 'Validation failed',
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

function getAuthenticatedUser(request: FastifyRequest): AccessTokenPayload {
  return (request as AuthenticatedRequest).user;
}

export const mfaRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/mfa/setup', {
    preHandler: verifyJwt,
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    try {
      const user = getAuthenticatedUser(request);
      const result = await app.mfaService.setup(user.sub);
      return reply.status(200).send(result);
    } catch (error: unknown) {
      return handleMfaRouteError(reply, error);
    }
  });

  app.post('/auth/mfa/verify', {
    preHandler: verifyJwt,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    try {
      const user = getAuthenticatedUser(request);
      const input = mfaVerifySchema.parse(request.body) as MfaVerifyInput;
      await app.mfaService.verify(user.sub, input);
      return reply.status(204).send();
    } catch (error: unknown) {
      return handleMfaRouteError(reply, error);
    }
  });

  app.post('/auth/mfa/disable', {
    preHandler: verifyJwt,
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    try {
      const user = getAuthenticatedUser(request);
      const input = mfaDisableSchema.parse(request.body) as MfaDisableInput;
      await app.mfaService.disable(user.sub, input);
      return reply.status(204).send();
    } catch (error: unknown) {
      return handleMfaRouteError(reply, error);
    }
  });

  app.post('/auth/mfa/challenge', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    try {
      const input = mfaChallengeSchema.parse(request.body) as MfaChallengeInput;
      const result = await app.mfaService.challenge(input);
      return reply.status(200).send(result);
    } catch (error: unknown) {
      return handleMfaRouteError(reply, error);
    }
  });
};

function handleMfaRouteError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof ZodError) {
    return sendValidationError(reply, error);
  }

  if (error instanceof MfaError || error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  throw error;
}
