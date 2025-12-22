<!-- docs/roadmap.md -->

# Roadmap

This roadmap is the **source of truth** for scope and iteration order.

Rules:
- Implement **one iteration at a time**.
- Any deviation (scope/architecture/API) must be recorded in `docs/changes.md`, and if architectural, also in `docs/adr/`.
- Every iteration must update this file (checkboxes) and keep docs consistent.

---

## Iteration 0 — Repo Bootstrap

**Goal:** monorepo skeleton + strict TypeScript + base packages wired.

### Deliverables
- [ ] pnpm workspace configured (`pnpm-workspace.yaml`)
- [ ] `apps/web`: React + Vite + TypeScript
- [ ] `@xyflow/react` installed and a placeholder canvas renders
- [ ] `packages/dsl`: Graph DSL v0.1 types + Zod validation + tests
- [ ] `packages/core`: registry skeleton + compiler placeholder + tests
- [ ] `packages/sim`: engine interfaces skeleton + tests (no engine logic yet)
- [ ] `packages/node-types-core`: core node type placeholders exported via registry
- [ ] `packages/viz`: placeholder helpers
- [ ] `packages/examples`: at least one example graph that validates
- [ ] Root scripts: `dev`, `test`, `typecheck`, `lint`
- [ ] README: quickstart + project principles + how to add node types

### Definition of Done (DoD)
- `pnpm i && pnpm typecheck && pnpm test` passes
- `pnpm dev` starts the web app
- Example graph validates in tests using `packages/dsl`

---

## Iteration A — Editor MVP (Build / Connect / Configure / Save)

**Goal:** build and edit graphs in the browser; import/export DSL JSON.

### Deliverables
- [ ] XYFlow canvas: create nodes, connect edges, move nodes
- [ ] Node palette (left): add core node types
- [ ] Inspector (right): edit selected node/edge parameters
- [ ] Import/Export JSON:
  - [ ] Export current graph (DSL JSON)
  - [ ] Import DSL JSON with validation; show errors in UI
- [ ] Validation in `packages/core`: missing refs, duplicate ids, unknown type ids
- [ ] No simulation logic in `apps/web`

### DoD
- User can assemble a graph, configure params, export, import, and see validation errors
- Unit tests exist for DSL parsing and compiler validation

---

## Iteration B — Simulation MVP (Deterministic Engine + Counters + Tokens)

**Goal:** run/step/pause simulation with deterministic results; show counters and moving tokens.

### Deliverables
- [ ] `packages/sim`: discrete-event engine (event queue)
- [ ] Runtime state:
  - [ ] node counters (e.g., pool balance)
  - [ ] active tokens (for animation)
  - [ ] event log entries (for debugging)
- [ ] Implement semantics in `packages/node-types-core`:
  - [ ] `core.Source` generates tokens
  - [ ] `core.Pool` stores tokens
  - [ ] `core.Drain` consumes tokens
  - [ ] `core.Gate` conditional pass-through
- [ ] `apps/web`: Simulation toolbar (Run/Pause/Step/Reset + speed)
- [ ] Token visualization: tokens move along edges; counters render on nodes
- [ ] Golden test: run example graph for N steps and snapshot counters

### DoD
- Same seed + same graph => identical results
- Engine remains UI-agnostic (no React imports)

---

## Iteration C — Machinations-Like Features (Weights, Delays, Expressions)

**Goal:** closer to Machinations mechanics: weighted routing, delays, batch/rate expressions.

### Deliverables
- [ ] DSL v0.2 + migration from v0.1
- [ ] Edge features:
  - [ ] `weight` for weighted routing
  - [ ] `delayMs`
  - [ ] `batchExpr`
- [ ] Basic expression evaluator (safe, deterministic)
- [ ] Weighted routing uses seeded RNG (deterministic)
- [ ] UI inspector supports new fields
- [ ] Tests:
  - [ ] migration tests (v0.1 -> v0.2)
  - [ ] deterministic weighted routing test

### DoD
- A graph can model a simple feedback loop with probabilistic branching and delays

---

## Iteration D — Extensibility Hardening (Plugins, Versioning, Documentation)

**Goal:** adding new node types and DSL features is predictable and low-risk.

### Deliverables
- [ ] Formalize `NodeTypeDefinition` plugin API and document it
- [ ] Example plugin package: `packages/node-types-economy` (e.g., `economy.Shop`)
- [ ] Expand docs:
  - [ ] "How to add a node type"
  - [ ] "How to bump DSL versions and write migrations"
- [ ] Add ADRs for major choices and revisit if needed
- [ ] More golden tests for representative graphs

### DoD
- New node type can be added by:
  1) create module + schema + simulate + tests
  2) register in its package index
  3) UI auto-picks it up via registry