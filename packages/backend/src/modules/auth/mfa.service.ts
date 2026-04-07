import type { PrismaClient } from '@prisma/client';
import { generateSecret, generateURI, verify as totpVerify } from 'otplib';
import { decryptString, encryptString } from '../../lib/crypto';
import {
  type JwtSigner,
  type LoginSuccessResult,
  issueLoginTokensAndCreateSession,
  verifyPassword,
} from './auth.service';
import type {
  MfaChallengeInput,
  MfaDisableInput,
  MfaVerifyInput,
} from './mfa.schema';

const MFA_ISSUER = 'AI Assistant';

export interface MfaServiceDependencies {
  prisma: Pick<PrismaClient, 'user' | 'session'>;
  jwtSigner: JwtSigner;
  encryptionKey: Buffer;
  now?: () => Date;
}

export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
}

export class MfaError extends Error {
  public readonly statusCode: number;

  public constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'MfaError';
    this.statusCode = statusCode;
  }
}

export class MfaService {
  private readonly prisma: Pick<PrismaClient, 'user' | 'session'>;
  private readonly jwtSigner: JwtSigner;
  private readonly encryptionKey: Buffer;
  private readonly now: () => Date;

  public constructor(dependencies: MfaServiceDependencies) {
    this.prisma = dependencies.prisma;
    this.jwtSigner = dependencies.jwtSigner;
    this.encryptionKey = dependencies.encryptionKey;
    this.now = dependencies.now ?? (() => new Date());
  }

  public async setup(userId: string): Promise<MfaSetupResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, deletedAt: true, mfaEnabled: true },
    });

    if (!user || user.deletedAt) {
      throw new MfaError('User not found', 404);
    }

    if (user.mfaEnabled) {
      throw new MfaError('MFA is already enabled. Disable it before reconfiguring.', 409);
    }

    const secret = generateSecret();
    const encryptedSecret = encryptString(secret, this.encryptionKey);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: encryptedSecret, mfaEnabled: false },
    });

    return {
      secret,
      otpauthUrl: generateURI({ issuer: MFA_ISSUER, label: user.email, secret }),
    };
  }

  public async verify(userId: string, input: MfaVerifyInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new MfaError('User not found', 404);
    }

    await this.verifyTotpAndCheckReplay(user.id, input.token, user.mfaSecret);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });
  }

  public async disable(userId: string, input: MfaDisableInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, mfaSecret: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new MfaError('User not found', 404);
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new MfaError('Invalid password or MFA token', 401);
    }

    await this.verifyTotpAndCheckReplay(user.id, input.token, user.mfaSecret);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: null, mfaEnabled: false },
    });
  }

  public async challenge(input: MfaChallengeInput): Promise<LoginSuccessResult> {
    const payload = await this.verifyMfaSessionToken(input.mfaSessionToken);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, mfaSecret: true, mfaEnabled: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new MfaError('User not found', 404);
    }

    if (!user.mfaEnabled) {
      throw new MfaError('MFA is not enabled for this user', 400);
    }

    await this.verifyTotpAndCheckReplay(user.id, input.token, user.mfaSecret);

    return issueLoginTokensAndCreateSession({
      prisma: this.prisma,
      jwtSigner: this.jwtSigner,
      now: this.now,
      user: { id: user.id, email: user.email },
    });
  }

  private getStoredSecret(encryptedSecret: string | null): string {
    if (!encryptedSecret) {
      throw new MfaError('MFA has not been configured for this user', 400);
    }

    return decryptString(encryptedSecret, this.encryptionKey);
  }

  private async verifyTotpAndCheckReplay(
    userId: string,
    token: string,
    encryptedSecret: string | null,
  ): Promise<void> {
    const secret = this.getStoredSecret(encryptedSecret);
    const result = await totpVerify({ token, secret });

    if (!result.valid) {
      throw new MfaError('Invalid MFA token', 401);
    }

    const currentStep = Math.floor(this.now().getTime() / 1000 / 30);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaLastUsedToken: true, mfaLastUsedAt: true },
    });

    if (user?.mfaLastUsedToken === token && user.mfaLastUsedAt) {
      const lastStep = Math.floor(user.mfaLastUsedAt.getTime() / 1000 / 30);

      if (lastStep === currentStep) {
        throw new MfaError('MFA token has already been used', 401);
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaLastUsedToken: token, mfaLastUsedAt: this.now() },
    });
  }

  private async verifyMfaSessionToken(token: string) {
    try {
      const payload = await this.jwtSigner.verifyMfaSessionToken(token);

      if (payload.type !== 'mfa_pending') {
        throw new MfaError('Invalid MFA session token', 401);
      }

      return payload;
    } catch (error: unknown) {
      if (error instanceof MfaError) {
        throw error;
      }

      throw new MfaError('Invalid MFA session token', 401);
    }
  }
}
