import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PrismaClient } from '@prisma/client';
import type { LoginInput, RefreshInput, RegisterInput } from './auth.schema';

const scrypt = promisify(scryptCallback);
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface JwtSigner {
  signAccessToken(payload: TokenPayload): Promise<string>;
  signRefreshToken(payload: TokenPayload): Promise<string>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
}

export interface AuthServiceDependencies {
  prisma: Pick<PrismaClient, 'user' | 'session'>;
  jwtSigner?: JwtSigner;
  now?: () => Date;
}

export interface RegisterResult {
  accessToken: string;
  user: { id: string; email: string };
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
}

export interface RefreshResult {
  accessToken: string;
}

export class AuthError extends Error {
  public readonly statusCode: number;

  public constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class AuthService {
  private readonly prisma: Pick<PrismaClient, 'user' | 'session'>;
  private readonly jwtSigner?: JwtSigner;
  private readonly now: () => Date;

  public constructor(dependencies: AuthServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.jwtSigner = dependencies.jwtSigner;
    this.now = dependencies.now ?? (() => new Date());
  }

  public async register(input: RegisterInput): Promise<RegisterResult> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new AuthError('A user with this email already exists', 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    const accessToken = await this.getJwtSigner().signAccessToken({
      sub: user.id,
      email: user.email,
      type: 'access',
    });

    return { accessToken, user };
  }

  public async login(input: LoginInput): Promise<LoginResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new AuthError('Invalid email or password', 401);
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AuthError('Invalid email or password', 401);
    }

    const signer = this.getJwtSigner();
    const tokenPayload: TokenPayload = { sub: user.id, email: user.email, type: 'refresh' };
    const accessToken = await signer.signAccessToken({ ...tokenPayload, type: 'access' });
    const refreshToken = await signer.signRefreshToken(tokenPayload);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(this.now().getTime() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  public async logout(input: RefreshInput): Promise<void> {
    const deleted = await this.prisma.session.deleteMany({
      where: { tokenHash: hashRefreshToken(input.refreshToken) },
    });

    if (deleted.count === 0) {
      throw new AuthError('Session not found', 404);
    }
  }

  public async refresh(input: RefreshInput): Promise<RefreshResult> {
    const signer = this.getJwtSigner();
    const payload = await signer.verifyRefreshToken(input.refreshToken);

    if (payload.type !== 'refresh') {
      throw new AuthError('Invalid refresh token', 401);
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashRefreshToken(input.refreshToken) },
    });

    if (!session) {
      throw new AuthError('Session not found', 401);
    }

    if (session.expiresAt.getTime() <= this.now().getTime()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new AuthError('Refresh token expired', 401);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new AuthError('User not found', 401);
    }

    const accessToken = await signer.signAccessToken({
      sub: user.id,
      email: user.email,
      type: 'access',
    });

    return { accessToken };
  }

  private getJwtSigner(): JwtSigner {
    if (!this.jwtSigner) {
      throw new Error('JWT signer has not been configured');
    }

    return this.jwtSigner;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [algorithm, salt, storedKey] = passwordHash.split(':');

  if (algorithm !== 'scrypt' || !salt || !storedKey) {
    throw new AuthError('Stored password hash format is invalid', 500);
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(storedKey, 'hex');

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getAccessTokenTtl(): string {
  return ACCESS_TOKEN_TTL;
}

export function getRefreshTokenTtl(): string {
  return REFRESH_TOKEN_TTL;
}
