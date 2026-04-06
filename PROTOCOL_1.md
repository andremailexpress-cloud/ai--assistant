# Protocol 1 — Loadshedding / Power Outage / Forced Restart
## AI Assistant Platform — Contingency Doctrine v1
## Authored: 2026-04-05 | Status: ACTIVE

---

## Trigger Conditions
Any of the following activates Protocol 1:
- Session interruption (token/context limit reached)
- Power outage / loadshedding
- App crash or connectivity break
- Forced stop by user

---

## Immediate Effect
- All active implementation work halts
- No new code, no new tasks, no new agent spawns
- Assessment phase begins before anything resumes

---

## Temporary Role Shift

| Normal Role | Protocol 1 Role |
|-------------|----------------|
| Claude — Head of Planning | Recovery Lead |
| Kimi — Research | QC Officer |
| Codex — Execution | Assessment Lead |
| Sub-agents | Assessors |

Roles return to normal ONLY after system stability is confirmed at end of Phase E.

---

## Phase A — Damage Report (Claude)
- Identify all interrupted tasks
- Identify last confirmed good state per task
- Identify missing artifacts, labels, or context
- Produce a ranked list: what is safe, what is partial, what is unknown

## Phase B — Workpiece Assessment (Codex + Assessors)
Each in-progress item is classified using workpiece status codes:

| Code | Meaning |
|------|---------|
| G | Good — complete and verified |
| U | Unverified — complete but not QC'd |
| P | Partial — incomplete, salvageable |
| R | Rebuild required — incomplete, not salvageable |
| X | Invalid / discard |

## Phase C — QC Review (Kimi)
- Reviews all assessments from Phase B
- Flags: risks, inconsistencies, dropped handoff data, unclear ownership
- Produces QC finding report with severity: CRITICAL / HIGH / MEDIUM / LOW

## Phase D — Recovery Strategy (Claude)
- Sets order of recovery based on Phase A + C findings
- Decision per item: RESUME / REPAIR / REBUILD / DISCARD
- Reassigns tasks to agents
- Does NOT return to normal operations until this plan is approved by USER

## Phase E — Return to Operations
- Normal department roles restored
- Task log updated with restart timestamps
- Incident logged (see INCIDENT_LOG.md)
- Every resumed task must declare:
  - Last known state
  - Confidence in recovered state (HIGH / MEDIUM / LOW)
  - What is assumed vs what is verified

---

## Key Rule
> No agent may silently resume old assumptions after restart.
> Every resumed task must explicitly declare its recovered state before proceeding.

---

## Future Protocols (Planned)
- Protocol 2 — Handoff corruption
- Protocol 3 — QC conflict
- Protocol 4 — Planner unavailable
- Protocol 5 — Execution failure
- Protocol 6 — Research contradiction event
