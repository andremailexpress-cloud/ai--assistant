import type { PrismaClient } from '@prisma/client';
import {
  AuthError,
  AuthService,
  getAccessTokenTtl,
  getMfaSessionTokenTtl,
  getRefreshTokenTtl,
  hashPassword,
  verifyPassword,
} from './auth.service';

type UserDelegate = Pick<PrismaClient['user'], 'findUnique' | 'create'>;
type SessionDelegate = Pick<PrismaClient['session'], 'create' | 'deleteMany' | 'findUnique' | 'delete'>;

function createPrismaMock(overrides: Partial<{ user: UserDelegate; session: SessionDelegate }> = {}) {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      ...overrides.user,
    },
    session: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      ...overrides.session,
    },
  } as Pick<PrismaClient, 'user' | 'session'>;
}

function createJwtSignerMock() {
  return {
    signAccessToken: jest.fn().mockResolvedValue('access-token'),
    signRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
    signMfaSessionToken: jest.fn().mockResolvedValue('mfa-session-token'),
    verifyRefreshToken: jest.fn().mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'refresh' as const,
    }),
    verifyMfaSessionToken: jest.fn().mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'mfa_pending' as const,
    }),
  };
}

describe('AuthService', () => {
  it('hashes and verifies passwords using the seed format', async () => {
    const hash = await hashPassword('very-secure-password');

    await expect(verifyPassword('very-secure-password', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('registers a new user and returns an access token', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);
    prisma.user.create = jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    const service = new AuthService({ prisma, jwtSigner });

    const result = await service.register({ email: 'User@Example.com', password: 'very-secure-password' });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'user@example.com' }),
      }),
    );
    expect(jwtSigner.signAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'access',
    });
    expect(result.accessToken).toBe('access-token');
  });

  it('rejects invalid credentials during login', async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);
    const service = new AuthService({ prisma, jwtSigner: createJwtSignerMock() });

    await expect(service.login({ email: 'missing@example.com', password: 'very-secure-password' })).rejects.toEqual(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('creates a hashed refresh-token session on login', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      deletedAt: null,
      passwordHash: await hashPassword('very-secure-password'),
      mfaEnabled: false,
    });
    prisma.session.create = jest.fn().mockResolvedValue({ id: 'session-1' });
    const now = new Date('2026-04-07T00:00:00.000Z');
    const service = new AuthService({ prisma, jwtSigner, now: () => now });

    const result = await service.login({ email: 'user@example.com', password: 'very-secure-password' });

    expect(jwtSigner.signAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'access',
    });
    expect(jwtSigner.signRefreshToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'refresh',
    });
    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.any(String),
          expiresAt: new Date('2026-04-14T00:00:00.000Z'),
        }),
      }),
    );
    if ('mfaRequired' in result) {
      throw new Error('Expected login to return access and refresh tokens');
    }

    expect(result.refreshToken).toBe('refresh-token');
  });

  it('returns an MFA challenge instead of issuing tokens when MFA is enabled', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      deletedAt: null,
      passwordHash: await hashPassword('very-secure-password'),
      mfaEnabled: true,
    });
    const service = new AuthService({ prisma, jwtSigner });

    const result = await service.login({ email: 'user@example.com', password: 'very-secure-password' });

    expect(jwtSigner.signMfaSessionToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'mfa_pending',
    });
    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      mfaRequired: true,
      mfaSessionToken: 'mfa-session-token',
    });
  });

  it('deletes the session on logout', async () => {
    const prisma = createPrismaMock();
    prisma.session.deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = new AuthService({ prisma, jwtSigner: createJwtSignerMock() });

    await expect(service.logout({ refreshToken: 'refresh-token' })).resolves.toBeUndefined();
  });

  it('returns a new access token from a valid refresh token', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.session.findUnique = jest.fn().mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date('2026-04-14T00:00:00.000Z'),
      createdAt: new Date('2026-04-07T00:00:00.000Z'),
    });
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      deletedAt: null,
    });
    const service = new AuthService({
      prisma,
      jwtSigner,
      now: () => new Date('2026-04-07T00:00:00.000Z'),
    });

    const result = await service.refresh({ refreshToken: 'refresh-token' });

    expect(jwtSigner.verifyRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(result).toEqual({ accessToken: 'access-token' });
  });

  it('exposes the intended token lifetimes', () => {
    expect(getAccessTokenTtl()).toBe('15m');
    expect(getRefreshTokenTtl()).toBe('7d');
    expect(getMfaSessionTokenTtl()).toBe('5m');
  });
});
