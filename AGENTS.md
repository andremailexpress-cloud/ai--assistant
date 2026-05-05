# AGENTS.md — AI Assistant Platform

> Project context for Codex. Read this before starting any task.

## Project

**Job ID:** 050426-1  
**What:** Modular AI assistant platform — generative avatar, RAG, knowledge graph, skill marketplace.  
**Stack:** TypeScript (Node.js/Fastify) + Python (RAG/ML) + React + PostgreSQL + Neo4j + pgvector

## Monorepo Structure

```
packages/
  backend/     — Fastify API (TypeScript)
  frontend/    — React + Tailwind + Three.js
  shared/      — Shared types/utils
  rag-service/ — Python RAG/ML microservice
```

Backend entry: `packages/backend/src/index.ts`  
ORM: Prisma — schema at `packages/backend/prisma/schema.prisma`

## Current Phase

**Phase 1 — Core Platform Foundation**

| Task | Status |
|------|--------|
| T-P1-001 Database schema | ✅ |
| T-P1-002 Prisma migrations | ✅ |
| T-P1-003 JWT auth API | ✅ |
| T-P1-004 MFA (TOTP) | ✅ |
| T-P1-005 Model-agnostic LLM gateway (NVIDIA NIM) | ⏳ NEXT |

## LLM Gateway

The gateway is **model-agnostic** — built on the OpenAI-compatible API spec.  
Users supply their own `baseUrl`, `apiKey`, and `model` at account level (encrypted, never logged).

**Dev/testing default:** `meta/llama-3.3-70b-instruct` via NVIDIA NIM (`https://integrate.api.nvidia.com/v1`)  
Limits: 1000 API calls, 40 req/min — no token rate limits (context window is the only constraint).

## Backend Conventions

- **Framework:** Fastify with TypeScript
- **Auth:** JWT (access + refresh tokens) — see `packages/backend/src/modules/auth/`
- **Validation:** Zod schemas (see `auth.schema.ts` pattern)
- **DB access:** Prisma client via `packages/backend/src/lib/prisma.ts`
- **File structure:** one module = one folder: `routes.ts`, `service.ts`, `schema.ts`, `*.test.ts`
- **Tests:** Jest — run with `npm test` from `packages/backend`
- **No mutation** — return new objects, never mutate in place

## Code Rules

1. TypeScript strict mode — no `any`
2. All inputs validated with Zod at route level
3. Errors must be explicit — never swallow silently
4. No hardcoded secrets — use `process.env.*`
5. Functions under 50 lines, files under 800 lines
6. Parameterized queries only — no raw SQL string interpolation

## Auth Module (existing — T-P1-003)

Key files:
- `packages/backend/src/modules/auth/auth.routes.ts` — POST /auth/register, /auth/login, /auth/logout, /auth/refresh
- `packages/backend/src/modules/auth/auth.service.ts` — business logic
- `packages/backend/src/modules/auth/auth.schema.ts` — Zod schemas
- `packages/backend/src/middleware/jwt.middleware.ts` — JWT verification middleware

## Team Roles

- **Claude (Sonnet 4.6)** — **Head of Planning & Architecture.** Operates at the top level for complex reasoning and system-wide reviews.
- **Qwen3 (480b)** — **Primary Implementation & Chat.** The daily driver for logic and coding tasks.
- **Codex** — **Specialist Coder.** Invoked for production-grade implementation when Qwen3 requires assistance.
- **DeepSeek (V4)** — **The Shadow / Substitute.** Bench model to replace Codex or Qwen3 if malfunctions occur.
- **Qwen2.5 Coder** — **Scaffolding & Boilerplate.** Handles repetitive code patterns and initial file structures.

