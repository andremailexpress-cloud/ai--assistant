-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mfaSecret" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tier" "UserTier" NOT NULL DEFAULT 'FREE',
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "sandboxConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "attachedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skillId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "issuedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tier_idx" ON "users"("tier");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_version_key" ON "skills"("name", "version");

-- CreateIndex
CREATE INDEX "skills_createdAt_idx" ON "skills"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "user_skills"("userId", "skillId");

-- CreateIndex
CREATE INDEX "user_skills_skillId_idx" ON "user_skills"("skillId");

-- CreateIndex
CREATE INDEX "user_skills_userId_expiresAt_idx" ON "user_skills"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "user_skills_skillId_expiresAt_idx" ON "user_skills"("skillId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_stripeSubscriptionId_key" ON "licenses"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_licenseKey_key" ON "licenses"("licenseKey");

-- CreateIndex
CREATE INDEX "licenses_skillId_idx" ON "licenses"("skillId");

-- CreateIndex
CREATE INDEX "licenses_userId_idx" ON "licenses"("userId");

-- CreateIndex
CREATE INDEX "licenses_status_idx" ON "licenses"("status");

-- CreateIndex
CREATE INDEX "licenses_expiresAt_idx" ON "licenses"("expiresAt");

-- CreateIndex
CREATE INDEX "licenses_userId_status_idx" ON "licenses"("userId", "status");

-- CreateIndex
CREATE INDEX "licenses_skillId_status_idx" ON "licenses"("skillId", "status");

-- AddForeignKey
ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills"
ADD CONSTRAINT "user_skills_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills"
ADD CONSTRAINT "user_skills_skillId_fkey"
FOREIGN KEY ("skillId") REFERENCES "skills"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses"
ADD CONSTRAINT "licenses_skillId_fkey"
FOREIGN KEY ("skillId") REFERENCES "skills"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses"
ADD CONSTRAINT "licenses_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
