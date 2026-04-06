# ADR-PSY-001: Motivation & Behaviour Change

## Status
Accepted

## Key Theories

### Self-Determination Theory (SDT)
Three innate psychological needs drive sustained motivation: Autonomy (self-chosen actions), Competence (feeling effective), Relatedness (feeling connected). The more autonomous the motivation, the more persistent and well-being-enhancing the behaviour.

**Application:** Frame all suggestions as invitations not commands. Surface incremental progress. Simulate relational warmth through consistent personality and memory — transparently, never deceptively.

### BJ Fogg — Tiny Habits
Behaviour occurs when Motivation + Ability + Prompt converge (MAP model). Motivation is volatile — Ability (making it easy) and reliable Prompts are the more controllable levers. Celebrate immediately after completion to wire in positive emotion.

**Application:** Attach suggestions to natural anchor moments, not fixed times. Always start with the minimum viable version of a behaviour. Never open with the full-sized ask.

### Habit Loop (Duhigg / Clear)
Cue → Routine → Reward, mediated by Craving. Four laws: make it obvious, attractive, easy, satisfying. Habits stored in basal ganglia as chunked routines once established.

**Application:** Serve as the intelligent cue layer. Reduce friction on desired behaviours to near zero. Deliver proximate reward immediately on completion — not in a weekly summary.

## Feature Design Implications
1. Offer, never command — all suggestions are invitations with an easy decline path
2. Start smaller than the user expects — minimum viable behaviour first
3. Time prompts to context, not clocks — behavioural anchors not scheduled times
4. Close the reward loop within the session — immediate proportionate feedback
5. Make competence visible progressively — emphasise trajectory over absolute values
6. Preserve user explanatory agency — user attributes success to their own behaviour
7. Personalise motivation type — autonomy vs competence vs social framing
8. Make friction asymmetric — easy in, deliberate (not punitive) out
9. Respect autonomy over engagement metrics — internalised habit = success
10. Separate tracking from judgement — present data neutrally, never render verdicts

## Anti-Patterns to Avoid
1. Streak guilt and punitive loss framing ("You've lost your 14-day streak!")
2. Variable reward schedules for engagement (slot machine mechanics)
3. Social comparison without consent (unsolicited leaderboards)
4. Escalating notification pressure on non-response
5. Attributing user success to the platform ("Your AI helped you save $500")
6. Sunk-cost manipulation ("Don't throw away 30 days of progress")
7. Manufactured urgency and artificial scarcity

## Consequences
- Sustained engagement over extracted engagement — durable habits, lower churn
- Differentiated market position on ethics
- Metrics must shift from engagement proxies to outcome proxies (goal attainment, behaviour persistence)
- Personalisation investment required — motivation type varies significantly per user
- Ongoing ethics review obligation at each major feature release
