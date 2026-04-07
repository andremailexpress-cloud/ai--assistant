import { z } from 'zod';

const mfaTokenSchema = z.string().regex(/^\d{6}$/, 'MFA token must be a 6-digit code');

export const mfaVerifySchema = z.object({
  token: mfaTokenSchema,
});

export const mfaDisableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  token: mfaTokenSchema,
});

export const mfaChallengeSchema = z.object({
  mfaSessionToken: z.string().min(1, 'MFA session token is required'),
  token: mfaTokenSchema,
});

export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type MfaDisableInput = z.infer<typeof mfaDisableSchema>;
export type MfaChallengeInput = z.infer<typeof mfaChallengeSchema>;
