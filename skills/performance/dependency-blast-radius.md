---
name: nexus-performance-dependency-blast-radius
description: >
  Use this sub-skill when assessing the risk and impact of upgrading a dependency — library,
  framework, or runtime. Trigger phrases: "upgrade X from version A to B", "blast radius of
  upgrading", "what breaks if we upgrade", "which services use this library", "is this upgrade
  safe", "dependency upgrade risk", "breaking change analysis", "semver impact analysis",
  "upgrade impact report", "CVE patch upgrade risk", "which consumers will be affected".
  Expected output: consumer map, risk score, breaking change list, test coverage gaps, and a
  go/no-go recommendation. When in doubt, use this skill.
---

# Dependency Blast Radius Analysis

Map all consumers of a dependency, classify the risk of the proposed version change, detect
breaking changes, and produce a go/no-go recommendation with a migration plan.

---

## Core Principle

**Never recommend an upgrade without knowing who it affects and what it breaks.**

A dependency upgrade with no blast radius analysis is a gamble. Even a patch version bump can
break code that depends on private APIs or undocumented behavior. This sub-skill produces the
evidence needed to make an informed upgrade decision.

---

## Workflow

### Step 1 — Identify All Consumers

Map every place the dependency is used across the entire codebase — direct and transitive.

#### Direct consumers (the dependency is in requirements.txt / package.json / go.mod directly):

```bash
# Python — find all files importing the library
grep -r "import sqlalchemy\|from sqlalchemy" . --include="*.py" -l

# Node.js — find all require/import calls
grep -r "require('express')\|from 'express'" . --include="*.js" --include="*.ts" -l

# Go — find all import paths
grep -r '"github.com/gin-gonic/gin"' . --include="*.go" -l

# Java / Gradle — find all usages in source
grep -r "import org.springframework" . --include="*.java" -l
```

#### Transitive consumers (the dependency is pulled in by another library):

```bash
# Python
pip show <package> | grep "Required-by"
pip-tree --reverse <package>   # if pip-tree is available

# Node.js
npm ls <package>               # shows all packages that depend on it
npm why <package>              # explains why a package is installed

# Go
go mod graph | grep <module>   # find all modules that depend on the target

# Java / Maven
mvn dependency:tree -Dincludes=<groupId>:<artifactId>
```

Build a consumer table:

```
| Consumer (service/file)          | Import type   | Usage pattern               |
|----------------------------------|---------------|-----------------------------|
| services/auth/db.py              | Direct        | SQLAlchemy Session, Query   |
| services/billing/models.py       | Direct        | SQLAlchemy ORM models       |
| services/reporting/export.py     | Direct        | SQLAlchemy Core expressions |
| services/gateway (via auth-sdk)  | Transitive    | auth-sdk depends on package |
```

---

### Step 2 — Classify the Semver Risk

Determine the type of version change and the baseline risk level:

| Change type | Semver signal | Baseline risk | What to expect |
|-------------|--------------|--------------|----------------|
| **Patch** (1.4.8 → 1.4.9) | Third segment | Low | Bug fixes only — no API changes per semver contract |
| **Minor** (1.4.x → 1.5.0) | Second segment | Medium | New features, deprecated APIs, behavioral changes in edge cases |
| **Major** (1.x → 2.0.0) | First segment | High | Breaking API changes, removed APIs, behavior changes |
| **Pre-release** (x → 2.0.0-rc1) | `-alpha`/`-beta`/`-rc` | Very High | Unstable API, may change between pre-release and final |

Note: Many libraries do not follow semver strictly. Always check the actual changelog regardless
of the semver signal.

---

### Step 3 — Breaking Change Detection

For every version between current and target, check:

**Step 3a: Read the changelog**

```bash
# Find the changelog
# PyPI: https://pypi.org/project/<name>/#history
# npm: https://www.npmjs.com/package/<name>?activeTab=versions
# GitHub: look for CHANGELOG.md, CHANGES.rst, or GitHub Releases
```

Scan for these keywords in the changelog entries for each version in the upgrade range:
- `breaking`, `removed`, `deprecated`, `renamed`, `no longer`, `changed behavior`, `migration guide`
- `BREAKING CHANGE` (conventional commit format)
- `**BREAKING**` (common in Python changelogs)

**Step 3b: Check for API removals using the codebase**

Compare the APIs your code uses against the APIs removed or changed in the target version:

```bash
# Find all method/function calls from the library in your code
grep -r "session\.query\|session\.execute" . --include="*.py"
grep -r "\.filter(\|\.filter_by(" . --include="*.py"
```

Cross-reference these against the changelog to find which specific call patterns are affected.

**Step 3c: Check migration guides**

Major upgrades almost always have official migration guides. Find and read them:
- SQLAlchemy 1.4 → 2.0: https://docs.sqlalchemy.org/en/14/changelog/migration_20.html
- Express 4 → 5: https://expressjs.com/en/guide/migrating-5.html
- Django 3.x → 4.x: https://docs.djangoproject.com/en/4.0/releases/4.0/

**Produce a breaking change table:**

```
| API / Behavior                    | Status in current | Status in target | Affected files |
|-----------------------------------|------------------|-----------------|----------------|
| `Session.query()` method          | Available        | Removed (use select()) | 8 files |
| `relationship(lazy='dynamic')`    | Available        | Deprecated warning | 3 files |
| `engine.execute()`                | Available        | Removed | 2 files |
| Connection-level transactions     | Auto-commit mode | Explicit begin required | 5 files |
```

---

### Step 4 — Test Coverage Assessment

Assess whether existing tests will catch regressions from the upgrade:

```bash
# Find tests for the affected code paths
find . -name "test_*.py" -o -name "*_test.py" | xargs grep -l "sqlalchemy\|Session\|query" 2>/dev/null

# Check test coverage for affected files (if coverage is configured)
coverage run -m pytest tests/
coverage report --include="services/auth/db.py,services/billing/models.py"
```

Evaluate test coverage quality, not just existence:

| Coverage level | Description | Risk signal |
|---------------|-------------|-------------|
| **High** | Tests exercise the specific API patterns being changed | Regressions will be caught in CI |
| **Medium** | Tests exist but test high-level behavior, not the specific API calls | Some regressions may be caught |
| **Low** | Tests exist but don't cover the changed code paths | Most regressions will reach production |
| **None** | No tests for the affected code | All regressions will reach production |

---

### Step 5 — Risk Scoring

Calculate a composite risk score:

| Factor | Score |
|--------|-------|
| Semver change: patch = 1, minor = 2, major = 4, pre-release = 5 | |
| Number of direct consumers: 1–3 = 1, 4–10 = 2, 11+ = 3 | |
| Number of breaking changes affecting your code: 0 = 0, 1–3 = 2, 4+ = 4 | |
| Test coverage: high = -1, medium = 0, low = 1, none = 3 | |
| Has official migration guide: yes = -1, no = 1 | |

**Total score → Risk level:**
- 0–3: **Low** — proceed with confidence; run CI
- 4–7: **Medium** — upgrade in a branch; run full test suite; manual smoke test key flows
- 8–12: **High** — require dedicated migration effort; feature freeze; staged rollout
- 13+: **Critical** — do not upgrade without a full migration plan and extended test phase

---

### Step 6 — Go/No-Go Recommendation

Produce a recommendation using this structure:

**Go** when:
- Risk score is Low or Medium
- All breaking changes are catalogued and have clear mitigations
- Test coverage is Medium or High for affected paths
- A rollback plan exists (version pinning, feature flag, canary)

**No-Go** when:
- Risk score is High or Critical without a dedicated migration window planned
- Breaking changes affect core paths with no test coverage
- The upgrade is for a non-security reason and the engineering cost exceeds the benefit

**Staged upgrade** when:
- Risk is Medium or High but the upgrade is required (CVE fix, EOL version)
- Recommend: upgrade one service first, validate for 48h, then roll out to remaining consumers

---

## Output Format

```
## Dependency Blast Radius Report

**Dependency:**         [name + current version → target version]
**Semver Change:**      [patch / minor / major / pre-release]
**Upgrade Reason:**     [CVE fix / new feature / EOL / performance / other]

**Consumer Map:**
[table: consumer file/service | import type | usage pattern | breaking change impact]

**Breaking Changes:**
[table: API/behavior | current status | target status | affected files]

**Test Coverage:**      [high / medium / low / none — per affected path]
**Risk Score:**         [N / 15 — calculation shown]
**Risk Level:**         [Low / Medium / High / Critical]

**Recommendation:**     [Go / No-Go / Staged upgrade — one sentence justification]

**Migration Steps:**
[ordered list of changes required, per affected file or service]

**Rollback Plan:**
[how to revert if the upgrade causes a production issue]

**Validation:**
[commands to run to confirm the upgrade is safe: test suite, smoke test, metrics to watch]
```

---

## Anti-Patterns

- Never assess risk from the semver number alone — always read the changelog for the upgrade range.
- Never scope the consumer map to only the repository you are in — check all services that import the package.
- Never recommend a go without a rollback plan — dependency upgrades can break in subtle ways only visible under production load.
- Never skip transitive dependency analysis — a library you don't directly import may be a consumer of the package being upgraded.
- Never treat "all tests pass" as sufficient validation for a major upgrade — tests may not cover the specific breaking change patterns.
- Never upgrade multiple major dependencies in the same PR — if something breaks, you cannot isolate the cause.
