import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthError } from '../modules/auth/auth.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const payload = await request.jwtVerify<AccessTokenPayload>();

    if (payload.type !== 'access') {
      throw new AuthError('Invalid access token', 401);
    }
  } catch (error: unknown) {
    reply.status(401).send({ message: 'Unauthorized' });
  }
}
