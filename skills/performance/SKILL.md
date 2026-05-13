---
name: nexus-performance
description: >
  Use for memory, CPU, latency, and query-performance investigations, plus dependency-upgrade
  blast-radius analysis. Trigger on leak/OOM/profiling/regression reports or "what breaks if I upgrade X."
  Route to memory-leak or dependency-blast-radius workflow based on intent.
  When in doubt, use this skill.
---

# Nexus Performance

Route to the correct sub-skill and follow it end-to-end.

---

## Compatibility
- Sub-skills: `memory-leak.md`, `dependency-blast-radius.md`
- Supporting files: `examples/production-scenarios.md`, `checklists/performance-checklist.md`,
  `heuristics/performance-heuristics.md`, `anti-patterns/common-mistakes.md`,
  `validation/output-validation.md`
- Required tools: Read, Bash, Grep
- Hands off to: `nexus:debugging` for single-service runtime failures
- Hands off to: `nexus:planning` after the fix is approved

---

## Routing

### Step 1 — Classify the Request

Pick exactly one track:

| Track | Signal | Sub-skill |
|-------|--------|-----------|
| **Memory Leak** | "memory growing", "OOM kill", "heap dump", "RSS increasing", "memory usage creeping up", process being killed by the OS | `memory-leak.md` |
| **Dependency Blast Radius** | "upgrade X to version Y", "what breaks if I upgrade", "which services use this lib", "blast radius of upgrading", "safe to upgrade?", "dependency impact analysis" | `dependency-blast-radius.md` |

If the request does not clearly fit one track, ask one question: "Is this about memory/CPU/latency
behavior of a running service, or about the risk of upgrading a dependency?"

### Step 2 — Read Sub-Skill and Execute

Read the appropriate sub-skill file. Follow its numbered steps in order. Do not skip steps.
Read `heuristics/performance-heuristics.md` for fast pattern-matching before starting investigation.

### Step 3 — Validate Output

Before presenting results, check against `validation/output-validation.md`.

---

## Output Format

Each sub-skill defines its own output format. This router produces no standalone output.

---

## Anti-Patterns

- Never profile a running production process without confirming the profiling overhead is acceptable.
- Never recommend a dependency upgrade without completing the blast radius analysis first.
- Never mix tracks — complete one sub-skill fully before considering another.
- Never skip reading the actual code or configuration — performance issues are almost always specific to the exact version and usage pattern.
- Never recommend "just increase memory/CPU limits" without first identifying the root cause — scaling a leak just delays the next OOM.

---

## Examples

**"Memory usage is growing by 50MB per hour and the process gets OOM killed every 12 hours"**
→ route to `memory-leak.md`

**"We want to upgrade SQLAlchemy from 1.4 to 2.0 — what will break?"**
→ route to `dependency-blast-radius.md`

**"Our API latency is 3× higher than yesterday after the last deploy"**
→ route to `memory-leak.md` if memory metrics are elevated; otherwise route to `nexus:debugging`

**"Which of our services import requests==2.28.0 and would be affected by this CVE patch upgrade?"**
→ route to `dependency-blast-radius.md`
