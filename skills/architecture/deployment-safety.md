# Deployment Safety Guide

## Goal
Prevent user-impacting regressions during architecture or boundary changes.

## Safety Tiers
- Low: internal refactor, no interface changes
- Medium: behavior/config changes behind a flag
- High: contract/data/infra changes with blast radius

## Required Controls
1. Pre-deploy checks: tests, migrations checks, config validation.
2. Progressive rollout: canary/staged percentage.
3. Runtime guards: feature flags, health checks, alarms.
4. Fast rollback path with exact trigger conditions.

## Output
- Risk tier
- Guardrails enabled
- Rollback trigger
- Owner and verification command
