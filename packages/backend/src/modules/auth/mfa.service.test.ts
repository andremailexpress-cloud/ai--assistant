import type { PrismaClient } from '@prisma/client';
import { decryptString, encryptString } from '../../lib/crypto';
import { hashPassword } from './auth.service';
import { MfaError, MfaService } from './mfa.service';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'JBSWY3DPEHPK3PXP'),
  generateURI: jest.fn(({ issuer, label, secret }: { issuer: string; label: string; secret: string }) =>
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`,
  ),
  verify: jest.fn(async ({ token, secret }: { token: string; secret: string }) => ({
    valid: token === `valid-${secret}`,
  })),
}));

type UserDelegate = Pick<PrismaClient['user'], 'findUnique' | 'update'>;
type SessionDelegate = Pick<PrismaClient['session'], 'create'>;

function createPrismaMock(overrides: Partial<{ user: UserDelegate; session: SessionDelegate }> = {}) {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      ...overrides.user,
    },
    session: {
      create: jest.fn(),
      ...overrides.session,
    },
  } as Pick<PrismaClient, 'user' | 'session'>;
}

function createJwtSignerMock() {
  return {
    signAccessToken: jest.fn().mockResolvedValue('access-token'),
    signRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
    signMfaSessionToken: jest.fn().mockResolvedValue('mfa-session-token'),
    verifyRefreshToken: jest.fn(),
    verifyMfaSessionToken: jest.fn().mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'mfa_pending' as const,
    }),
  };
}

describe('MfaService', () => {
  const encryptionKey = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8');
  const secret = 'JBSWY3DPEHPK3PXP';
  const encryptedSecret = requireEncryptedSecret(secret, encryptionKey);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-07T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates and stores an encrypted secret during setup', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      deletedAt: null,
      mfaEnabled: false,
    });
    prisma.user.update = jest.fn().mockResolvedValue({ id: 'user-1' });
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });

    const result = await service.setup('user-1');

    expect(result.secret).toMatch(/^[A-Z2-7]+$/);
    expect(result.otpauthUrl).toContain('otpauth://totp/');
    expect(result.otpauthUrl).toContain('user%40example.com');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          mfaSecret: expect.any(String),
          mfaEnabled: false,
        }),
      }),
    );

    const encryptedSecret = (prisma.user.update as jest.Mock).mock.calls[0][0].data.mfaSecret as string;
    expect(decryptString(encryptedSecret, encryptionKey)).toBe(result.secret);
  });

  it('enables MFA after a valid token is verified', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });
    prisma.user.findUnique = jest.fn()
      .mockResolvedValueOnce({
        id: 'user-1',
        mfaSecret: encryptedSecret,
        deletedAt: null,
      })
      .mockResolvedValueOnce({
        mfaLastUsedToken: null,
        mfaLastUsedAt: null,
      });
    prisma.user.update = jest.fn()
      .mockResolvedValueOnce({ id: 'user-1', mfaLastUsedToken: `valid-${secret}`, mfaLastUsedAt: new Date('2026-04-07T00:00:00.000Z') })
      .mockResolvedValueOnce({ id: 'user-1', mfaEnabled: true });

    await service.verify('user-1', { token: `valid-${secret}` });

    expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-1' },
      data: { mfaLastUsedToken: `valid-${secret}`, mfaLastUsedAt: new Date('2026-04-07T00:00:00.000Z') },
    });
    expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-1' },
      data: { mfaEnabled: true },
    });
  });

  it('disables MFA after confirming the password and token', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn()
      .mockResolvedValueOnce({
        id: 'user-1',
        passwordHash: await hashPassword('very-secure-password'),
        mfaSecret: encryptedSecret,
        deletedAt: null,
      })
      .mockResolvedValueOnce({
        mfaLastUsedToken: null,
        mfaLastUsedAt: null,
      });
    prisma.user.update = jest.fn()
      .mockResolvedValueOnce({ id: 'user-1', mfaLastUsedToken: `valid-${secret}`, mfaLastUsedAt: new Date('2026-04-07T00:00:00.000Z') })
      .mockResolvedValueOnce({ id: 'user-1' });
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });

    await service.disable('user-1', {
      password: 'very-secure-password',
      token: `valid-${secret}`,
    });

    expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-1' },
      data: { mfaLastUsedToken: `valid-${secret}`, mfaLastUsedAt: new Date('2026-04-07T00:00:00.000Z') },
    });
    expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-1' },
      data: { mfaSecret: null, mfaEnabled: false },
    });
  });

  it('completes the MFA challenge and issues the normal login tokens', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn()
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        mfaSecret: encryptedSecret,
        mfaEnabled: true,
        deletedAt: null,
      })
      .mockResolvedValueOnce({
        mfaLastUsedToken: null,
        mfaLastUsedAt: null,
      });
    prisma.session.create = jest.fn().mockResolvedValue({ id: 'session-1' });
    prisma.user.update = jest.fn().mockResolvedValue({
      id: 'user-1',
      mfaLastUsedToken: `valid-${secret}`,
      mfaLastUsedAt: new Date('2026-04-07T00:00:00.000Z'),
    });
    const now = new Date('2026-04-07T00:00:00.000Z');
    const service = new MfaService({ prisma, jwtSigner, encryptionKey, now: () => now });

    const result = await service.challenge({
      mfaSessionToken: 'pending-token',
      token: `valid-${secret}`,
    });

    expect(jwtSigner.verifyMfaSessionToken).toHaveBeenCalledWith('pending-token');
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1', email: 'user@example.com' },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { mfaLastUsedToken: `valid-${secret}`, mfaLastUsedAt: new Date('2026-04-07T00:00:00.000Z') },
    });
    expect(prisma.session.create).toHaveBeenCalled();
  });

  it('rejects invalid MFA session tokens', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    jwtSigner.verifyMfaSessionToken.mockRejectedValue(new Error('bad token'));
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });

    await expect(service.challenge({
      mfaSessionToken: 'bad-token',
      token: '123456',
    })).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects verify with an invalid token', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn().mockResolvedValueOnce({
      id: 'user-1',
      mfaSecret: encryptedSecret,
      deletedAt: null,
    });
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });

    await expect(service.verify('user-1', { token: 'wrong-token' })).rejects.toEqual(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('rejects disable with a wrong password', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn().mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: await hashPassword('very-secure-password'),
      mfaSecret: encryptedSecret,
      deletedAt: null,
    });
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });

    await expect(service.disable('user-1', {
      password: 'wrong-password',
      token: `valid-${secret}`,
    })).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects disable with a wrong totp token', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn().mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: await hashPassword('very-secure-password'),
      mfaSecret: encryptedSecret,
      deletedAt: null,
    });
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });

    await expect(service.disable('user-1', {
      password: 'very-secure-password',
      token: 'wrong-token',
    })).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects setup when MFA is already enabled', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    prisma.user.findUnique = jest.fn().mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      deletedAt: null,
      mfaEnabled: true,
    });
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });

    await expect(service.setup('user-1')).rejects.toEqual(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it('rejects challenge when the MFA session token type is not mfa_pending', async () => {
    const prisma = createPrismaMock();
    const jwtSigner = createJwtSignerMock();
    jwtSigner.verifyMfaSessionToken.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'access',
    });
    const service = new MfaService({ prisma, jwtSigner, encryptionKey });

    await expect(service.challenge({
      mfaSessionToken: 'bad-type-token',
      token: `valid-${secret}`,
    })).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
  });
});

function requireEncryptedSecret(secret: string, encryptionKey: Buffer): string {
  return encryptString(secret, encryptionKey);
}
