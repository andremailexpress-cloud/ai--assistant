# AI Assistant Platform

A modular, personalized AI assistant with a living avatar, RAG over user files, a knowledge graph, and a skill marketplace. Built on behavioral science. Designed to help users become better — not to exploit them.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Node.js 20 + Fastify + TypeScript |
| Frontend | React 18 + Vite + Three.js + TypeScript |
| RAG Service | Python 3.11 + FastAPI |
| Primary DB | PostgreSQL 16 + pgvector |
| Graph DB | Neo4j AuraDB |
| Cache | Redis 7 |
| ORM | Prisma |
| Auth | JWT (access + refresh) + TOTP MFA |
| LLM | Model-agnostic (NVIDIA NIM / Llama 3.3 70B for dev) |
| Payments | Stripe |
| CI/CD | GitHub Actions |
| Infra | Docker + Kubernetes |

---

## Monorepo Structure

```
packages/
  backend/      — Fastify API (auth, skills, avatar, LLM gateway)
  frontend/     — React workspace UI + Three.js avatar
  rag-service/  — Python RAG pipeline, embeddings, semantic search
  shared/       — Types, constants, sphere definitions (consumed by all packages)
docs/
  ADR/          — Architecture Decision Records
  ADR/psychology/ — Behavioral science research
```

---

## Quick Start

```bash
# Requires: Docker Desktop, Node.js 20+
git clone https://github.com/andremailexpress-cloud/ai--assistant.git
cd ai--assistant
cp .env.example .env   # fill in secrets
npm install
npm run dev            # spins up all services via docker compose
```

Services:
- Frontend → http://localhost:3000
- Backend API → http://localhost:3001
- RAG Service → http://localhost:8000

---

## Current Status

**Phase 1 — Core Platform Foundation** (active)

| Task | Description | Status |
|------|-------------|--------|
| T-P1-001 | Database schema (Prisma) | ✅ |
| T-P1-002 | Prisma migrations + seed | ✅ |
| T-P1-003 | JWT auth API | ✅ |
| T-P1-004 | MFA / TOTP | ✅ |
| T-P1-005 | Model-agnostic LLM gateway (NVIDIA NIM) | ⏳ Next |

Full phase breakdown → [MASTER_WORKFLOW.md](MASTER_WORKFLOW.md)  
Full product vision → [ROADMAP.md](ROADMAP.md)  
Behavioral science foundation → [PSYCHOLOGY_RESEARCH_DIRECTIVE.md](PSYCHOLOGY_RESEARCH_DIRECTIVE.md)

---

## Architecture Decisions

| ADR | Decision |
|-----|----------|
| [ADR-001](docs/ADR/ADR-001-knowledge-graph-db.md) | Neo4j selected for knowledge graph |
| [ADR-002](docs/ADR/ADR-002-vector-db.md) | pgvector selected for embeddings |

---

## Tiers

| Tier | Skills | Price |
|------|--------|-------|
| Free | 2 | $0 |
| Pro | 5 | ~$19–24/mo |
| Business | 15 | ~$59–79/mo |
| Enterprise | Unlimited | Custom |

---

## Principles

- Psychology-first — every feature is backed by peer-reviewed behavioral science
- Privacy-first — zero knowledge between users, encrypted at rest and in transit  
- Ethics-first — no dark patterns, no manufactured urgency, no slot-machine loops
- No feature ships without a documented behavioral science foundation

---

## Agent Workflow

| Agent | Role |
|-------|------|
| Claude Sonnet 4.6 | Head of Planning & Architecture |
| Qwen3 480b | Primary implementation |
| Codex | Specialist coder (complex blocks) |
| DeepSeek V4 | Shadow / substitute |
| Qwen2.5 Coder | Scaffolding & boilerplate |

