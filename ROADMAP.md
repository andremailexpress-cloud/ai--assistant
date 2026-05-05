# AI Assistant Platform — Roadmap

**Vision**
A modular, personalized AI assistant that acts as a true companion. It learns the user deeply, grows with them, handles files intelligently, coordinates skills via an agent swarm, and features a living avatar that visually evolves with the assistant's intelligence and the user's progress.

The core mission: Assist the user to become the best version of themselves by making tasks easier, providing genuine help, and never manipulating or undermining user autonomy.

---

## Core Strengths

- Modular Architecture with Plugin System and Skill Registry
- Per-User Learning & Personalization Engine
- Living Avatar with Emotional Intelligence and Generative Visualization
- Agent Swarm for Parallel Skill Execution and Coordination
- Next-Level RAG (Contextual Synthesis, Temporal Tracking, Predictive Proactivity, Cross-Skill Fusion)
- Privacy-First Design with Strong User Isolation
- Gated Skill Licensing & Tiered Monetization (Free / Pro / Business / Enterprise + Skill Marketplace)
- Comprehensive Security (5-layer jailbreak prevention, sandboxing, encryption, audit logging)

## Tech Stack

- **Backend:** Node.js 20 + Fastify + TypeScript
- **Frontend:** React 18 + Vite + Three.js
- **RAG Service:** Python 3.11 + FastAPI
- **LLM:** Model-agnostic gateway (OpenAI-compatible API — users bring their own model/key)
- **Database:** PostgreSQL 16 + pgvector + Neo4j AuraDB
- **Payments:** Stripe

---

## Development Phases

### Phase 0: Research & Planning ✅
- Architecture Decision Records (ADRs) — knowledge graph, vector DB
- Psychology-informed framework
- Monorepo scaffold + CI pipeline

### Phase 1: Core Platform Foundation (active)
- User management & authentication (MFA, sessions) ✅
- Database schema + migrations ✅
- JWT auth API ✅
- MFA / TOTP ✅
- Model-agnostic LLM gateway (OpenAI-compatible, NVIDIA NIM for dev) ⏳

### Phase 2: File Ingestion & RAG Foundation
- Drag-and-drop File Workspace (PDFs, docs, code, images)
- Text extraction, embedding generation, vector storage
- Basic semantic search & context injection
- Privacy isolation per user

### Phase 3: Knowledge Graph & Temporal Context
- Knowledge graph (Neo4j) for connecting data points
- File versioning & change tracking
- Temporal context (how information evolves over time)

### Phase 4: Contextual Fusion & Synthesis
- Cross-skill RAG fusion layer
- Advanced multi-context prompt assembly
- Contextual intelligence (holistic recommendations)

### Phase 5: Proactivity & Prediction + Agent Swarm
- Pattern recognition & anomaly detection
- Predictive triggers and proactive suggestions
- Full agent swarm orchestration

### Phase 6: Avatar Evolution, Monetization & Security Hardening
- Full living avatar (emotional expressions, plasma/neural stages)
- Skill licensing system with Stripe integration
- Tier enforcement (Free: 2 skills, Pro: 5, Business: 15, Enterprise: custom)
- Complete security model (5-layer jailbreak prevention, sandboxing, encryption, audit logs)

### Phase 7: Polish, Marketplace & Scaling
- Skill Marketplace (built-in + 3rd-party, 70/30 revenue split)
- Performance optimization & load testing
- Production deployment & monitoring

---

## Monetization

| Tier | Skills | Storage | Price |
|------|--------|---------|-------|
| Free | 2 | 100MB | $0 |
| Pro | 5 | 10GB | ~$19–24/mo |
| Business | 15 | 100GB | ~$59–79/mo |
| Enterprise | Unlimited | Custom | Custom |

Skill Marketplace: individual skills $4.99–$29.99/mo, 70/30 revenue split for 3rd-party developers.

---

## Avatar Evolution

- **Stage 1 (Awakening):** Red sphere — basic awareness
- **Stage 2 (Bonding):** Glowing orb — warm responses, learning moments
- **Stage 3 (Trust):** Plasma orb — multi-colour synthesis, protective modes
- **Stage 4 (Mastery):** Neural patterns — proactive, deeply personalised, user-customisable

---

## Security Architecture

- 5-layer jailbreak prevention
- Skill sandbox isolation
- Per-user data isolation & encryption at rest and in transit
- Runtime monitoring & immutable audit logs
- GDPR-compliant data flows

