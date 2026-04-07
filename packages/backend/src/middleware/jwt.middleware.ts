import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthError } from '../modules/auth/auth.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const payload = await request.jwtVerify<AccessTokenPayload>();

    if (payload.type !== 'access') {
      throw new AuthError('Invalid access token', 401);
    }
  } catch (error: unknown) {
    if (!(error instanceof AuthError)) {
      request.log.error({ err: error }, 'Unexpected error during JWT verification');
    }
    reply.status(401).send({ message: 'Unauthorized' });
    return;
  }
}
