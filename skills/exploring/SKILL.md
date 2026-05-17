---
name: codebase-navigator
description: >
  Token-efficient codebase navigation skill. Use this whenever the user wants to
  explore, understand, or find anything in their codebase — folder structure,
  entry points, config files, where a feature lives, or a specific file by name/purpose.
  Triggers on: "navigate my codebase", "explore the project", "find the file for X",
  "where is the code for Y", "show me the structure", "what's the entry point",
  "find config files", "understand this repo". Prefer this over raw `view` calls on
  directories.
---

# Codebase Navigator

A token-efficient skill for exploring any codebase quickly. The core principle:
**one `bash_tool` call to map, then targeted `view` calls only on confirmed files.**

---

This skill's approach:
1. **One `bash_tool` call** builds the full structural map (paths only, no content)
2. **Classify** the structure (monorepo? framework? lang?)
3. **Read only confirmed key files** — entry points, configs, the specific file asked for

---

## Step 1 — One-Shot Structure Scan

Always start with this single bash command. Adjust `ROOT` to the user's project root (default: `.` or whatever path they gave).

```bash
find ROOT -maxdepth 4 \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/.next/*' \
  -not -path '*/coverage/*' \
  -not -path '*/vendor/*' \
  -not -path '*/venv/*' \
  -not -path '*/.venv/*' \
  | sort
```

<!-- **If the tree is very large (>300 lines):** Re-run with `-maxdepth 3`, or add `-type f` to show only files, or narrow to a subtree. -->

---

## Step 2 — Classify the Repo

From the path list, identify:

| Signal | Inference |
|---|---|
| `package.json` at root | Node/JS project |
| `packages/` or `apps/` dirs | Monorepo (Turborepo, Nx, Lerna) |
| `pyproject.toml` / `setup.py` | Python project |
| `go.mod` | Go module |
| `Cargo.toml` | Rust |
| `next.config.*` | Next.js |
| `vite.config.*` | Vite frontend |
| `manage.py` | Django |
| `app/` + `config/` | Rails or Laravel |
| Multiple top-level dirs with own `package.json` | Monorepo |

Name the repo type confidently before continuing.

---

## Step 3 — Locate Key Files (by goal)

### Goal: Understand folder structure
Summarize from the path tree. No extra reads needed. Group by layer:
- Root config files (list them)
- Top-level dirs + one-line purpose each
- Source root (`src/`, `lib/`, `app/`) → key subdirs

### Goal: Find entry points
Read only the confirmed entry file. Common patterns:

| Type | Entry file |
|---|---|
| Node/Express | `src/index.ts`, `src/server.ts`, `index.js` |
| Next.js | `app/layout.tsx`, `pages/_app.tsx` |
| React (Vite/CRA) | `src/main.tsx`, `src/index.tsx` |
| Python | `main.py`, `app.py`, `manage.py`, `__main__.py` |
| Go | `main.go`, `cmd/*/main.go` |
| Rust | `src/main.rs`, `src/lib.rs` |
| Django | `manage.py` + `settings.py` |

Read the single entry file with `view`. Do not speculatively read others.

### Goal: Find config files
From the path tree, collect all files matching these names and read only the ones the user cares about:
- `*.config.*`, `.env*`, `docker-compose.*`, `Dockerfile`, `.github/workflows/*.yml`
- Language-specific: `tsconfig.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`

List them. Ask which one to open, or open all if there are ≤3.

### Goal: Find where a feature lives
Use grep to search for the feature name in file paths first (cheap), then content:

```bash
# Search paths first (very cheap)
find ROOT -type f -name "*FEATURE*" \
  -not -path '*/node_modules/*' -not -path '*/.git/*'

# Then search file contents (targeted — only in src dirs)
grep -rl "FEATURE" ROOT/src ROOT/app ROOT/lib 2>/dev/null \
  --include="*.ts" --include="*.tsx" --include="*.py" --include="*.go" \
  | head -20
```

Replace `FEATURE` with the keyword. Open only the top 1–2 most relevant hits.

### Goal: Find a file by name/purpose
```bash
find ROOT -type f -name "*KEYWORD*" \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  | head -20
```

---

## Token Budget Rules

| Action | When |
|---|---|
| `bash_tool` with `find` | Always first — one call |
| `bash_tool` with `grep` | When searching for a feature/keyword |
| `view FILE` | Only for confirmed, specific files the user needs |
| `view DIRECTORY` | **Avoid** — use `find` instead |
| Multiple sequential `view` calls | Only if user explicitly asked for multiple files |

**Never** do speculative reads — don't open a file "just to check". The path tree tells you almost everything. Only read file content when the user needs to see it or you need a specific value (like a port number or import path) to answer their question.

---

## Monorepo Fast-Path

If you detect a monorepo, immediately run a second scan per workspace to show the internal structure of each package:

```bash
# List all workspace package.json locations
find ROOT -name "package.json" \
  -not -path '*/node_modules/*' \
  -maxdepth 4 \
  | xargs grep -l '"name"' \
  | sort
```

Then read only the `name` and `scripts` fields (use `grep` not `view`) to summarize each package's purpose without loading the whole file.

---

## Examples

**User:** "Show me the structure of my project at /workspace/myapp"  
→ Run Step 1 scan on `/workspace/myapp`, classify, present the map. No file content reads unless entry point is ambiguous.

**User:** "Where is the authentication code?"  
→ Step 1 scan (if not done), then grep for `auth` in path names + contents of `src/`. Show the top matches.

**User:** "What's the entry point of this app?"  
→ Step 1 scan, classify, infer entry file from the table, `view` that one file only.

**User:** "Find all config files"  
→ Step 1 scan, filter for config patterns from the path list, present them. `view` only if asked.