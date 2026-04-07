import fastify from 'fastify';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './auth.routes';
import { AuthError, type AuthService } from './auth.service';

function createAuthServiceMock() {
  return {
    register: jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      user: { id: 'user-1', email: 'user@example.com' },
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1', email: 'user@example.com' },
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    refresh: jest.fn().mockResolvedValue({ accessToken: 'new-access-token' }),
  };
}

describe('authRoutes', () => {
  it('validates register payloads', async () => {
    const app = fastify();
    const authService = createAuthServiceMock();

    app.decorate('prisma', {});
    app.decorate('authService', authService as unknown as AuthService);
    await app.register(rateLimit);
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(authRoutes);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'invalid-email', password: 'short' },
    });

    expect(response.statusCode).toBe(400);
    expect(authService.register).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns 201 on successful registration', async () => {
    const app = fastify();
    const authService = createAuthServiceMock();

    app.decorate('prisma', {});
    app.decorate('authService', authService as unknown as AuthService);
    await app.register(rateLimit);
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(authRoutes);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'user@example.com', password: 'very-secure-password' },
    });

    expect(response.statusCode).toBe(201);
    expect(authService.register).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'very-secure-password',
    });
    await app.close();
  });

  it('rate limits login attempts after five requests', async () => {
    const app = fastify();
    const authService = createAuthServiceMock();

    app.decorate('prisma', {});
    app.decorate('authService', authService as unknown as AuthService);
    await app.register(rateLimit);
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(authRoutes);

    const payload = { email: 'user@example.com', password: 'very-secure-password' };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await app.inject({ method: 'POST', url: '/auth/login', payload });
      expect(response.statusCode).toBe(200);
    }

    const limitedResponse = await app.inject({ method: 'POST', url: '/auth/login', payload });

    expect(limitedResponse.statusCode).toBe(429);
    await app.close();
  });

  it('maps auth service errors to HTTP responses', async () => {
    const app = fastify();
    const authService = createAuthServiceMock();
    authService.refresh.mockRejectedValue(new AuthError('Invalid refresh token', 401));

    app.decorate('prisma', {});
    app.decorate('authService', authService as unknown as AuthService);
    await app.register(rateLimit);
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(authRoutes);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken: 'bad-token' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: 'Invalid refresh token' });
    await app.close();
  });

  it('returns 204 on logout', async () => {
    const app = fastify();
    const authService = createAuthServiceMock();

    app.decorate('prisma', {});
    app.decorate('authService', authService as unknown as AuthService);
    await app.register(rateLimit);
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(authRoutes);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      payload: { refreshToken: 'refresh-token' },
    });

    expect(response.statusCode).toBe(204);
    expect(authService.logout).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
    await app.close();
  });
});
