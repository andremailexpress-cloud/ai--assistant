# ADR-PSY-004: Chronobiology & Peak Performance Windows

## Status
Accepted

## Key Research

### Circadian Rhythms
Cognitive performance peaks 2-4 hours after waking (cortisol surge, rising core temperature). Afternoon trough 14:00-15:30 is biological not postprandial. Evening rebound 17:30-19:30.
Daniel Pink's phases: **Peak** (analytical focus), **Trough** (admin/routine), **Rebound** (creative/reflective).

### Ultradian Rhythms
~90-120 minute Basic Rest-Activity Cycles (BRAC). First 60-70 minutes = sustainable focus. Final 20-30 minutes = micro-fatigue signals (yawning, distraction, urge to check other stimuli). Interrupting mid-cycle imposes 23+ minute resumption cost. Target cycle boundaries for proactive contact.

### Chronotypes
~25% morning types (peak 8-10am), ~50% intermediate (peak 10am-12pm), ~25% evening types (peak 12-2pm+). 2-3 hour spread between extremes. Age-modulated: adolescents skew evening, adults shift morning after ~50.

## Default Proactivity Window Model (Intermediate Chronotype)
| Time | Phase | Policy |
|------|-------|--------|
| 06:00-08:00 | Pre-peak ramp | Low — respond only, don't push |
| 08:00-12:00 | Peak | Low-interruption — high-value suggestions only |
| 12:00-14:00 | Transition | Acceptable for low-cognitive-load suggestions |
| 14:00-15:30 | Deep trough | Avoid all non-urgent proactive contact |
| 15:30-17:30 | Recovery | Moderate — creative prompts, review tasks |
| 17:30-19:30 | Evening rebound | Good for planning, ideation, reflective check-ins |
| 19:30-22:00 | Wind-down | Reduce — light summaries only |
| 22:00+ | Sleep protection | No contact unless night-worker profile configured |

## Personalisation Strategy
Build a per-user hourly receptivity curve (0-1 score) from: session start time distribution, interaction quality signals (latency, message length, correction rate), task type self-selection, notification engagement rates, optional energy check-ins, calendar/sleep data if integrated. 21-day sliding window, Bayesian update daily. Cold-start: population default for first 7 days.

## Proactivity Timing Rules
1. Sleep protection is inviolable
2. Never interrupt within first 25 minutes of a continuous work session
3. Target ultradian boundaries — natural pause signals (idle >3-5 min, task completion, context switch)
4. Suppress trough window by default (14:00-15:30)
5. Queue high-cognitive-load suggestions for peak window delivery
6. Batch low-priority suggestions to early trough (12:00-14:00)
7. Use evening rebound for reflective and planning prompts
8. Personalisation offsets shift all windows proportionally by chronotype
9. Three consecutive dismissals in a window → suppress for 7 days + recalibrate
10. Surface manual quiet hours control — honour absolutely

## Consequences
- Improved suggestion acceptance rates and user trust
- Requires passive behavioural telemetry from day one — costly to retrofit
- Cold-start quality limited for ~50% of users who are significant larks/owls — consider 3-4 question onboarding MEQ subset
- Shift workers and frequent travellers require special-case handling
- Rhythm data is sensitive — define retention limits and transparency controls before deploying personalisation (GDPR)
