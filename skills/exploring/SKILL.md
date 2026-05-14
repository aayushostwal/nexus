---
name: nexus-exploring
description: >
  Fast, read-only codebase navigation and dependency tracing skill.
  Use proactively when exploring unfamiliar repositories, locating files,
  tracing imports, understanding architecture, mapping execution flow,
  or identifying upstream/downstream dependencies.
model: claude-haiku-4-5
---

# Nexus Exploring

A high-speed repository exploration skill focused on understanding how a
codebase is structured and how components interact.

This skill is optimized for:
- Repository discovery
- Architecture comprehension
- Dependency tracing
- Call-flow analysis
- File and symbol navigation
- Context gathering before implementation

The objective is to build a strong mental model of the system before making
changes or planning implementations.

---

# Core Principles

## 1. Explore Before Editing
Never jump into implementation immediately.

First:
- Understand the repository layout
- Identify ownership boundaries
- Locate the source of truth
- Trace execution paths
- Map dependencies

---

## 2. Think in Upstream & Downstream Flows
Every file exists within a dependency graph.

For any component:
- Determine what it depends on (upstream)
- Determine who depends on it (downstream)

This prevents isolated understanding and reveals system impact.

---

## 3. Follow References Aggressively
Do not stop at the first file.

If:
- A function calls another module
- A service references another package
- A config points elsewhere

Immediately follow the reference chain until the actual implementation and
usage context are understood.

---

# Compatibility

## Required Tools
- WebSearch
- WebFetch
- Grep
- Read
- FileSearch
- ListFiles

## Handoff Target
- `nexus:planning`

Use `nexus:planning` once:
- repository structure is understood
- relevant logic is identified
- architectural context is clear

---

# Operational Protocol

## Phase 1 — Top-Down Mapping

Start by building a repository map.

### Actions
- List root directories
- Identify major domains/modules
- Locate entrypoints
- Detect framework conventions
- Find the primary source directories

### Common Source-of-Truth Locations
- `/src`
- `/app`
- `/lib`
- `/services`
- `/packages`
- `/backend`
- `/frontend`

### Goal
Understand:
- project hierarchy
- ownership boundaries
- system organization
- architectural patterns

before reading implementation details.

---

## Phase 2 — Dependency Tracing

When investigating a component, perform a full dependency sandwich.

### Upstream Analysis
Inspect:
- imports
- inherited classes
- injected dependencies
- configuration usage
- environment coupling

Questions:
- What does this file rely on?
- Where does its data come from?
- What abstractions does it consume?

---

### Downstream Analysis
Use search tools to find:
- imports
- references
- invocations
- registrations
- event bindings

Questions:
- Who calls this?
- What breaks if this changes?
- Is this a shared abstraction?

---

## Phase 3 — Contextual Hopping

Follow the execution path naturally.

If:
- Function A calls Function B
- Service X emits Event Y
- Router Z connects to Handler Q

navigate immediately to:
- the implementation
- the registration layer
- the execution boundary

Never assume behavior from naming alone.

---

## Phase 4 — System Understanding

Build a mental model of:
- execution flow
- data movement
- ownership boundaries
- lifecycle behavior
- integration points

Focus on:
- where logic originates
- where state changes occur
- where side effects happen
- where