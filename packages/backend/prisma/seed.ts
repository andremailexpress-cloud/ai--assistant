import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient, UserTier } from '@prisma/client';

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');

  return `scrypt:${salt}:${derivedKey}`;
}

async function main() {
  const email = requireEnv('DEV_ADMIN_EMAIL').trim().toLowerCase();
  const password = requireEnv('DEV_ADMIN_PASSWORD');
  const mfaSecret = process.env.DEV_ADMIN_MFA_SECRET?.trim() || null;

  const passwordHash = hashPassword(password);

  // The current schema does not model roles yet, so this seed creates the
  // designated development operator account with the highest available tier.
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, mfaSecret, mfaEnabled: Boolean(mfaSecret), tier: UserTier.ENTERPRISE, deletedAt: null },
    create: { email, passwordHash, mfaSecret, mfaEnabled: Boolean(mfaSecret), tier: UserTier.ENTERPRISE },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Prisma seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
