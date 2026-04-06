# AI Assistant Platform — Master Workflow
## Job ID: 050426-1 | Head of Planning: Claude Sonnet 4.6 | Coding Agent: Codex | Boilerplate Agent: Qwen3
## Created: 2026-04-05T00:00:00Z | Status: PENDING USER OK

---

## Chain of Command

```
USER (Owner / Final Authority)
  └── CLAUDE (Head of Planning & Oversight — this agent)
        ├── CODEX (Coding Agent — all implementation)
        ├── QWEN3 (Boilerplate Agent — scaffolding, repetitive code, test skeletons, docstrings)
        ├── QC Sub-Agents (post-task verification, by domain)
        │     ├── code-reviewer       → general code quality
        │     ├── security-reviewer   → auth, crypto, endpoints
        │     ├── tdd-guide           → test coverage verification
        │     ├── build-error-resolver → CI/build failures
        │     └── architect           → structural/design decisions
        └── Research Agents (Phase 0 only — 7 parallel)
```

---

## Session Rules (NON-NEGOTIABLE)

1. **Context Management** — At ~70% context usage:
   - Begin context compression (summarize non-critical history)
   - Preserve active task state and dependencies
   - Continue execution unless critical threshold is reached
   - Only halt if integrity of task execution is at risk

   **Active Context** (stays in window):
   - Current task
   - Current agent outputs
   - Dependencies

   **Archived Context** (compressed out, in this order):
   - Oldest reasoning first
   - Completed step details
   - Research summaries
   - Active context last — never compressed

   **At ~85% — State Verification Check (mandatory before continuing):**
   - Can the active task complete within remaining context? → If yes, continue
   - If no → halt cleanly, log verified state, notify user
   - If uncertain → halt immediately (uncertainty at high context = hallucination risk)
2. **Sequential Task Numbering** — Format: `T-000` (phase prefix) e.g. `T-P0-001`
3. **Timestamps** — All task starts, completions, and QC results in ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)
4. **QC on every task** — No task marked DONE without sub-agent sign-off
5. **User OK gate** — No phase begins without explicit user approval
6. **Codex handoff** — All code written by Codex. Claude plans, reviews, and coordinates.
   **Qwen3 pre-pass** — For tasks involving boilerplate (CRUD, models, test skeletons, docstrings), Qwen3 generates the scaffold first via Continue. Codex completes and refines. This keeps Codex focused on complexity, not repetition.
7. **Immutability** — New objects always. No in-place mutation.
8. **Security-first** — No secrets in code. Validate all inputs.
9. **GitHub is the single source of truth** — Every task = 1 Issue + 1 branch + 1 PR. No code merges without a passing PR review.

---

## GitHub Progress Tracking Architecture

GitHub is the official progress tracker for this project (confirmed in README).
Every task in this workflow maps 1:1 to a GitHub artifact.

### Structure

```
Repository: andremailexpress-cloud/ai--assistant
│
├── Milestones       → 1 per Phase  (Phase 0, Phase 1, ... Phase 7)
├── Labels           → team + status + priority (see below)
├── Issues           → 1 per task (T-P0-001, etc.) — opened BEFORE work starts
├── Branches         → 1 per task  (e.g. feat/T-P1-003-user-auth)
├── Pull Requests    → 1 per task  (linked to issue, assigned to QC reviewer)
└── GitHub Projects  → Kanban board: Backlog → In Progress → QC Review → Done
```

### Label System

| Label | Colour | Meaning |
|-------|--------|---------|
| `phase:0` – `phase:7` | Blue gradient | Which phase |
| `team:core-platform` | Purple | Core Platform Team |
| `team:skills` | Green | Skills Development |
| `team:backend-admin` | Orange | Backend & Admin |
| `team:testing` | Yellow | Testing Department |
| `agent:codex` | Dark grey | Assigned to Codex |
| `agent:qwen` | Teal | Assigned to Qwen3 (boilerplate/scaffolding) |
| `agent:research` | Light grey | Research agent task |
| `qc:pending` | Red | Awaiting QC sign-off |
| `qc:passed` | Bright green | QC cleared |
| `qc:failed` | Dark red | Returned for rework |
| `priority:critical` | Red | Blocking other tasks |
| `priority:high` | Orange | This phase gated on it |
| `priority:normal` | Grey | Standard |
| `security` | Black | Security-critical task |

### Branch Naming Convention

```
feat/T-P{phase}-{seq}-{short-description}
fix/T-P{phase}-{seq}-{short-description}
research/T-P{phase}-{seq}-{short-description}
chore/T-P{phase}-{seq}-{short-description}

Examples:
  feat/T-P1-003-user-auth
  feat/T-P3-001-neo4j-schema
  research/T-P0-001-knowledge-graph-db
```

### Pull Request Protocol

Every PR must:
1. Reference its Issue: `Closes #123`
2. Have the correct phase label and team label
3. Have `qc:pending` label on open, `qc:passed` on merge approval
4. Be reviewed by the designated QC sub-agent (noted in MASTER_WORKFLOW)
5. Pass all CI checks (lint, tests, build) before merge
6. **No direct pushes to `main` — ever**

### Branch Protection Rules (set on repo creation)
- `main` — requires PR + 1 approval + all CI checks green
- `develop` — requires PR + CI checks green
- Force push: disabled on both
- Delete on merge: enabled

### Milestone = Phase Gate
Each GitHub Milestone corresponds to a phase. A milestone closes only when:
- All its Issues are closed (QC passed)
- Claude formally signs off
- User gives OK to proceed to next phase

### GitHub Projects — Kanban Columns

```
| Backlog | In Progress | Codex Complete | QC Review | Done |
```
- **Backlog** — Issue created, not started
- **In Progress** — Codex has the branch open
- **Codex Complete** — PR raised, awaiting QC
- **QC Review** — Sub-agent reviewing
- **Done** — QC passed, PR merged, Issue closed

---

## Agent Roster & Roles

| Agent | Role | Invoked By |
|-------|------|-----------|
| Claude Sonnet 4.6 | Head of Planning & Oversight | Always active |
| Codex | Primary coding agent — complex implementation | Claude (per coding task) |
| Qwen3 Coder (via Continue/Ollama) | Boilerplate agent — CRUD scaffolding, repetitive patterns, test skeletons, docstrings. Zero token cost. | Claude (pre-Codex on scaffold tasks) |
| code-reviewer | QC — code quality, style, logic | Claude (post-Codex) |
| security-reviewer | QC — security vulnerabilities | Claude (auth/crypto/API tasks) |
| tdd-guide | QC — test coverage & TDD adherence | Claude (all feature tasks) |
| build-error-resolver | Fix build failures | Claude (on CI failure) |
| architect | Design validation | Claude (structural decisions) |
| planner | Sub-planning for complex tasks | Claude (multi-step features) |

---

## Required Credentials / Infrastructure (NEEDED BEFORE START)

The following must be provided or set up before Phase 1 coding begins:

| Item | Purpose | Status |
|------|---------|--------|
| GitHub repo: `andremailexpress-cloud/ai--assistant` | Source control + **issue tracking + project board + CI/CD** | NEEDED |
| GitHub account / org: `andremailexpress-cloud` | Org must exist before repo creation | VERIFY |
| Gemini Flash 1.5 API Key | LLM backbone | NEEDED |
| Stripe API Key (test mode) | Payment integration | NEEDED |
| PostgreSQL connection string | Primary database | NEEDED |
| Neo4j instance (local or cloud) | Knowledge graph | NEEDED |
| Docker / Docker Desktop | Containerization | VERIFY INSTALLED |
| Node.js v20+ | Backend runtime | VERIFY INSTALLED |
| Python 3.11+ | ML/RAG microservice | VERIFY INSTALLED |
| Deployment target | Hosting (Vercel? Railway? GCP? AWS?) | DECISION NEEDED |

---

## Tech Stack (Confirmed from README)

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Three.js (avatar 3D rendering)
- Custom GLSL shaders (particle system)
- Web Audio API (voice/TTS)
- WebSockets (real-time state sync)

### Backend
- Node.js + Fastify (TypeScript) — API gateway, auth, skill registry
- Python FastAPI — RAG pipeline, ML, knowledge graph queries
- PostgreSQL — primary relational data
- pgvector extension — vector embeddings (Phase 2, upgradeable to Pinecone)
- Neo4j — knowledge graph (Phase 3)
- Redis — caching, session management

### Infrastructure
- Docker (all services containerized)
- Kubernetes (production scaling)
- GitHub Actions (CI/CD)
- Stripe (billing)
- Gemini Flash 1.5 (LLM)

---

## Phase Overview & Gate Conditions

| Phase | Name | Gate Condition | Est. Tasks |
|-------|------|---------------|-----------|
| P0 | Research & Planning | User OK | **16 parallel research tasks** (7 technical + 9 psychology) |
| P1 | Core Platform Foundation | P0 complete + User OK | ~25 tasks |
| P2 | File Ingestion & RAG Foundation | P1 complete + User OK | ~20 tasks |
| P3 | Knowledge Graph & Temporal Context | P2 complete + User OK | ~18 tasks |
| P4 | Contextual Fusion & Synthesis | P3 complete + User OK | ~20 tasks |
| P5 | Proactivity & Prediction | P4 complete + User OK | ~15 tasks |
| P6 | Monetization, Licensing & Security | P5 complete + User OK | ~22 tasks |
| P7 | Polish & Scaling | P6 complete + User OK | ~15 tasks |

---

## Phase 0 — Research & Planning
### Gate: USER OK RECEIVED
### Deliverable: GitHub repo fully configured + Research ADRs + Monorepo scaffold

> **GitHub setup is T-P0-001 — nothing else starts until this is complete.**
> All subsequent tasks get Issues, branches, and PRs only after the repo exists.

| Task ID | Description | Agent | QC Agent | Status |
|---------|-------------|-------|----------|--------|
| T-P0-001 | GitHub repo creation (`andremailexpress-cloud/ai--assistant`), branch protection, milestones (P0–P7), all labels, GitHub Projects board (Kanban), issue templates | Codex | code-reviewer | PENDING |
| T-P0-002 | Bulk-create GitHub Issues for all Phase 0 tasks (T-P0-002 through T-P0-010) with correct labels + milestone | Claude | — | PENDING |
| T-P0-003 | Knowledge Graph DB comparison (Neo4j vs TigerGraph vs ArangoDB) → ADR-001 | Research/architect | architect | PENDING |
| T-P0-004 | Vector DB benchmark (Pinecone vs Weaviate vs Milvus vs pgvector) → ADR-002 | Research | architect | PENDING |
| T-P0-005 | File versioning & temporal context architecture patterns → ADR-003 | Research | architect | PENDING |
| T-P0-006 | Anomaly detection / predictive engine comparison → ADR-004 | Research | architect | PENDING |
| T-P0-007 | Gemini Flash multi-context prompt assembly patterns → ADR-005 | Research | code-reviewer | PENDING |
| T-P0-008 | RAG security threat model & defenses → ADR-006 | Research | security-reviewer | PENDING |
| T-P0-009 | Avatar visual state machine & WebGL shader patterns → ADR-007 | Research | code-reviewer | PENDING |
| T-P0-010 | Monorepo scaffold (packages: frontend, backend, rag-service, shared) + CI skeleton | Codex | code-reviewer | PENDING |

### Psychology Research Track (runs in PARALLEL with technical research above)
See full research directive: [PSYCHOLOGY_RESEARCH_DIRECTIVE.md](PSYCHOLOGY_RESEARCH_DIRECTIVE.md)

| Task ID | Research Domain | Deliverable | QC Agent | Status |
|---------|----------------|-------------|----------|--------|
| T-P0-PSY-001 | Motivation & Behavior Change (SDT, habit loops, BJ Fogg) | ADR-PSY-001 | architect | PENDING |
| T-P0-PSY-002 | Cognitive load, attention & decision fatigue | ADR-PSY-002 | architect | PENDING |
| T-P0-PSY-003 | Emotional psychology + avatar expression design | ADR-PSY-003 | architect | PENDING |
| T-P0-PSY-004 | Chronobiology + peak performance windows for proactivity timing | ADR-PSY-004 | architect | PENDING |
| T-P0-PSY-005 | Burnout & overload detection signals | ADR-PSY-005 | architect | PENDING |
| T-P0-PSY-006 | Learning science (spaced repetition, retrieval practice) | ADR-PSY-006 | architect | PENDING |
| T-P0-PSY-007 | Behavioral economics (hyperbolic discounting, loss aversion) | ADR-PSY-007 | architect | PENDING |
| T-P0-PSY-008 | Attachment theory, parasocial bonds & avatar lock-in design | ADR-PSY-008 | architect | PENDING |
| T-P0-PSY-009 | Ethics audit — manipulation risk review of all planned features | ADR-PSY-009 | security-reviewer | PENDING |

**P0 Output:**
- GitHub repo: fully configured with labels, milestones, project board, branch rules
- `docs/ADR/` — 7 Architecture Decision Records (technical)
- `docs/ADR/psychology/` — 9 Psychology Research ADRs
- Monorepo scaffold committed to `develop` branch

**Total Phase 0 research agents running in parallel: 16**
**Note:** All research tasks (T-P0-003 through T-P0-PSY-009) run simultaneously.

**Phase 0 Gate Requirement:**
Before Phase 1 starts, every feature in Phase 1 must be mapped to at least one psychology ADR.
No feature ships without a documented behavioral science foundation.

---

## Phase 1 — Core Platform Foundation
### Gate: P0 ADRs approved + User OK
### Teams: Core Platform + Backend + Testing

| Task ID | Description | Agent | QC Agent | Status |
|---------|-------------|-------|----------|--------|
| T-P1-001 | Database schema design (users, sessions, skills, licenses) | Codex | architect + code-reviewer | PENDING |
| T-P1-002 | PostgreSQL migrations (Prisma ORM) | Codex | code-reviewer | PENDING |
| T-P1-003 | User registration & login API (JWT) | Codex | security-reviewer | PENDING |
| T-P1-004 | MFA implementation (TOTP) | Codex | security-reviewer | PENDING |
| T-P1-005 | Gemini Flash LLM gateway service | Codex | code-reviewer | PENDING |
| T-P1-006 | Basic chat API endpoint (non-RAG) | Codex | code-reviewer + tdd-guide | PENDING |
| T-P1-007 | React app scaffold + routing | Codex | code-reviewer | PENDING |
| T-P1-008 | Auth UI (login, register, MFA) | Codex | code-reviewer | PENDING |
| T-P1-009 | Basic avatar (Three.js sphere — Level 0–20 state) | Codex | code-reviewer | PENDING |
| T-P1-010 | WebSocket server (avatar state push) | Codex | code-reviewer | PENDING |
| T-P1-011 | Basic admin dashboard (user list, skill list) | Codex | code-reviewer | PENDING |
| T-P1-012 | Skill SDK skeleton (interface, manifest schema) | Codex | architect + code-reviewer | PENDING |
| T-P1-013 | CI/CD pipeline (GitHub Actions: lint, test, build) | Codex | build-error-resolver | PENDING |
| T-P1-014 | Unit test setup (Jest + pytest) | Codex | tdd-guide | PENDING |
| T-P1-015 | Integration test setup | Codex | tdd-guide | PENDING |
| T-P1-016 | Docker Compose (dev environment) | Codex | code-reviewer | PENDING |
| T-P1-017 | Environment config & secrets management | Codex | security-reviewer | PENDING |

---

## Phase 2 — File Ingestion & RAG Foundation
### Gate: P1 complete + User OK

| Task ID | Description | Agent | QC Agent | Status |
|---------|-------------|-------|----------|--------|
| T-P2-001 | File upload API (drag-drop, chunking) | Codex | security-reviewer | PENDING |
| T-P2-002 | Document parsers (PDF, DOCX, TXT, MD) | Codex | code-reviewer | PENDING |
| T-P2-003 | pgvector setup + embedding pipeline | Codex | architect | PENDING |
| T-P2-004 | Semantic search API (Tier 1 RAG) | Codex | code-reviewer + tdd-guide | PENDING |
| T-P2-005 | File workspace UI (drag-drop, file list) | Codex | code-reviewer | PENDING |
| T-P2-006 | Calendar skill (Google Calendar integration) | Codex | security-reviewer + code-reviewer | PENDING |
| T-P2-007 | Notes skill (CRUD notes, indexed in RAG) | Codex | code-reviewer | PENDING |
| T-P2-008 | File management admin interface | Codex | code-reviewer | PENDING |
| T-P2-009 | Usage analytics (file count, query count) | Codex | code-reviewer | PENDING |
| T-P2-010 | RAG quality benchmarks (baseline metrics) | Codex | tdd-guide | PENDING |

---

## Phase 3 — Knowledge Graph & Temporal Context
### Gate: P2 complete + User OK

| Task ID | Description | Agent | QC Agent | Status |
|---------|-------------|-------|----------|--------|
| T-P3-001 | Neo4j setup + schema (User, Document, Event, Pattern, Decision nodes) | Codex | architect | PENDING |
| T-P3-002 | Knowledge graph ingestion pipeline | Codex | code-reviewer | PENDING |
| T-P3-003 | File versioning system (temporal snapshots) | Codex | code-reviewer | PENDING |
| T-P3-004 | Change impact analysis engine | Codex | code-reviewer | PENDING |
| T-P3-005 | Temporal context API (how user thinking evolves) | Codex | architect | PENDING |
| T-P3-006 | Health skill (metrics, goals, trend tracking) | Codex | security-reviewer + code-reviewer | PENDING |
| T-P3-007 | Task Management skill | Codex | code-reviewer | PENDING |
| T-P3-008 | Graph visualization UI (admin) | Codex | code-reviewer | PENDING |
| T-P3-009 | Version history UI (user-facing) | Codex | code-reviewer | PENDING |
| T-P3-010 | Graph query accuracy tests | Codex | tdd-guide | PENDING |

---

## Phase 4 — Contextual Fusion & Synthesis
### Gate: P3 complete + User OK

| Task ID | Description | Agent | QC Agent | Status |
|---------|-------------|-------|----------|--------|
| T-P4-001 | Cross-skill RAG bridge architecture | Codex | architect | PENDING |
| T-P4-002 | Knowledge fusion engine (multi-source context assembly) | Codex | architect + code-reviewer | PENDING |
| T-P4-003 | Gemini prompt assembly with fused context (Tier 2 RAG) | Codex | code-reviewer | PENDING |
| T-P4-004 | Context injection pipeline | Codex | code-reviewer | PENDING |
| T-P4-005 | Financial Planning skill | Codex | security-reviewer + code-reviewer | PENDING |
| T-P4-006 | Learning Accelerator skill | Codex | code-reviewer | PENDING |
| T-P4-007 | RAG quality dashboard (admin) | Codex | code-reviewer | PENDING |
| T-P4-008 | Fusion accuracy tests | Codex | tdd-guide | PENDING |

---

## Phase 5 — Proactivity & Prediction
### Gate: P4 complete + User OK

| Task ID | Description | Agent | QC Agent | Status |
|---------|-------------|-------|----------|--------|
| T-P5-001 | Pattern recognition engine (user behavior) | Codex | architect | PENDING |
| T-P5-002 | Anomaly detection module (fatigue, overload signals) | Codex | architect + code-reviewer | PENDING |
| T-P5-003 | Predictive trigger engine (Tier 3 RAG) | Codex | architect + tdd-guide | PENDING |
| T-P5-004 | Proactive suggestion delivery (push to UI) | Codex | code-reviewer | PENDING |
| T-P5-005 | Industry-specific skill bundles | Codex | code-reviewer | PENDING |
| T-P5-006 | Team Collaboration skill | Codex | security-reviewer + code-reviewer | PENDING |
| T-P5-007 | Predictive analytics dashboard (admin) | Codex | code-reviewer | PENDING |
| T-P5-008 | Predictive accuracy tests + false-positive rate tests | Codex | tdd-guide | PENDING |

---

## Phase 6 — Monetization, Licensing & Security Hardening
### Gate: P5 complete + User OK

| Task ID | Description | Agent | QC Agent | Status |
|---------|-------------|-------|----------|--------|
| T-P6-001 | Stripe subscription tiers (Free/Pro/Business/Enterprise) | Codex | security-reviewer | PENDING |
| T-P6-002 | Stripe webhook handlers (subscription changes, failed payments) | Codex | security-reviewer | PENDING |
| T-P6-003 | Skill licensing system (cryptographic signing + validation) | Codex | security-reviewer + architect | PENDING |
| T-P6-004 | Tier enforcement (attachment limits) | Codex | code-reviewer + security-reviewer | PENDING |
| T-P6-005 | Skill marketplace (list, purchase, attach) | Codex | security-reviewer + code-reviewer | PENDING |
| T-P6-006 | 3rd-party developer SDK | Codex | architect + code-reviewer | PENDING |
| T-P6-007 | License management (admin UI) | Codex | code-reviewer | PENDING |
| T-P6-008 | Billing portal (user self-service) | Codex | security-reviewer | PENDING |
| T-P6-009 | 5-layer jailbreak prevention implementation | Codex | security-reviewer | PENDING |
| T-P6-010 | Input sanitization + adversarial pattern detection | Codex | security-reviewer | PENDING |
| T-P6-011 | LLM output filtering (pre-user response scan) | Codex | security-reviewer | PENDING |
| T-P6-012 | Skill sandbox (Docker containerization + network whitelist) | Codex | security-reviewer + architect | PENDING |
| T-P6-013 | Runtime anomaly detection on agent behavior | Codex | security-reviewer | PENDING |
| T-P6-014 | Full security red team (OWASP Top 10) | security-reviewer | — | PENDING |
| T-P6-015 | Penetration testing | security-reviewer | — | PENDING |
| T-P6-016 | Avatar evolution system (RAG sophistication → visual state) | Codex | code-reviewer | PENDING |
| T-P6-017 | Revenue analytics dashboard | Codex | code-reviewer | PENDING |
| T-P6-018 | Audit log (who attached what skill, when) | Codex | security-reviewer | PENDING |

---

## Phase 7 — Polish & Scaling
### Gate: P6 complete + User OK

| Task ID | Description | Agent | QC Agent | Status |
|---------|-------------|-------|----------|--------|
| T-P7-001 | Performance optimization (API <200ms, RAG <500ms, avatar 60fps) | Codex | code-reviewer | PENDING |
| T-P7-002 | Load testing (10k concurrent → 500k users) | Codex | tdd-guide | PENDING |
| T-P7-003 | Full avatar emotional states (all 5 + all evolution levels) | Codex | code-reviewer | PENDING |
| T-P7-004 | Mobile responsiveness | Codex | code-reviewer | PENDING |
| T-P7-005 | Internationalization (i18n) scaffolding | Codex | code-reviewer | PENDING |
| T-P7-006 | B2B white-label options | Codex | architect + code-reviewer | PENDING |
| T-P7-007 | Full regression suite sign-off | Codex + tdd-guide | tdd-guide | PENDING |
| T-P7-008 | UAT — real users, cross-browser, mobile | e2e-runner | — | PENDING |
| T-P7-009 | Production deployment (K8s) | Codex | build-error-resolver | PENDING |
| T-P7-010 | GDPR/CCPA compliance audit | security-reviewer | — | PENDING |

---

## Task Log Format (TASK_LOG.md)

Every entry in TASK_LOG.md follows this format:

```
---
T-P{phase}-{seq} | {TASK NAME}
Start:      {ISO timestamp}
Agent:      {Codex / Research / Claude}
Status:     IN PROGRESS / COMPLETE / BLOCKED / FAILED
QC Agent:   {agent name}
QC Status:  PENDING / PASS / FAIL
QC Notes:   {findings}
Complete:   {ISO timestamp}
---
```

---

## Decision Log (OPEN ITEMS — Need User Input)

| Decision | Options | Recommendation | Status |
|----------|---------|---------------|--------|
| Deployment platform | Vercel+Railway / GCP / AWS / DigitalOcean | GCP (Cloud Run + Cloud SQL) — best Gemini integration | AWAITING USER |
| Vector DB (initial) | pgvector / Pinecone / Weaviate | pgvector (cost: free, good enough for Phase 2-3) | AWAITING USER |
| Knowledge graph | Neo4j AuraDB (cloud) / local Docker | Neo4j AuraDB free tier for dev, paid for prod | AWAITING USER |
| Frontend hosting | Vercel / GCP / Netlify | Vercel (best React DX) | AWAITING USER |
| Python RAG service | FastAPI / Django / Flask | FastAPI (async, modern, lightweight) | RECOMMEND FASTAPI |
| Domain name | TBD | andremailexpress-cloud domain? | AWAITING USER |
