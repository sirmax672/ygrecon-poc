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
- [x] pnpm workspace configured (`pnpm-workspace.yaml`)
- [x] `apps/web`: React + Vite + TypeScript
- [x] `@xyflow/react` installed and a placeholder canvas renders
- [x] `packages/dsl`: Graph DSL v0.2 types + Zod validation + tests
- [x] `packages/core`: registry skeleton + compiler placeholder + tests
- [x] `packages/sim`: engine interfaces skeleton + tests (no engine logic yet)
- [x] `packages/node-types-core`: core node type placeholders exported via registry
- [x] `packages/viz`: placeholder helpers
- [x] `packages/examples`: at least one example graph that validates
- [x] Root scripts: `dev`, `test`, `typecheck`, `lint`
- [x] README: quickstart + project principles + how to add node types

### Definition of Done (DoD)
- `pnpm i && pnpm typecheck && pnpm test` passes
- `pnpm dev` starts the web app
- Example graph validates in tests using `packages/dsl`

---

## Iteration A — Editor MVP (Build / Connect / Configure / Save)

**Goal:** build and edit graphs in the browser; import/export DSL JSON.

### Deliverables
- [x] XYFlow canvas: create nodes, connect edges, move nodes
- [x] Directed edges:
  - [x] All edges are directed and visually show direction (arrow marker)
  - [x] Default edge options include direction marker
- [x] Multi-handle node connections (ports):
  - [x] Nodes expose multiple connection points (handles) per side (at least Top/Right/Bottom/Left)
  - [x] Edges persist which exact handle they connect to (`sourceHandle`, `targetHandle`) in state and in exported DSL
  - [x] On import, edges restore the same handles
- [x] Edge reconnection (retargeting):
  - [x] User can grab an existing edge near the **target** and drag to another valid target handle/node
  - [x] Reconnection updates `target`, `targetHandle` and persists in DSL
- [x] Selection + delete:
  - [x] Nodes and edges can be selected (click; multi-select optional)
  - [x] Pressing **Delete/Backspace** removes selected nodes/edges
- [x] Node palette (left): add core node types
- [x] Inspector (right): edit selected node/edge parameters
- [x] Import/Export JSON:
  - [x] Export current graph (DSL JSON)
  - [x] Import DSL JSON with validation; show errors in UI
- [x] Validation in `packages/core`: missing refs, duplicate ids, unknown type ids
- [x] No simulation logic in `apps/web`

### DoD
- User can assemble a graph, configure params, export, import, and see validation errors
- Unit tests exist for DSL parsing and compiler validation

---

## Iteration A2 — Editable Edge Geometry (Polyline / Bend Points)

**Goal:** allow users to control edge geometry (not only automatic straight/curved lines).

### Deliverables
- [x] Edge geometry model:
  - [x] Introduce a new edge type: `polyline`
  - [x] Persist bend points in `edge.data.points` as an ordered list: `[{ x, y }, ...]`
  - [x] Export/Import DSL must round-trip `edge.data.points`
- [x] Rendering:
  - [x] `polyline` edges render as straight segments through the bend points (source -> p1 -> ... -> target)
  - [x] Keep arrow marker direction correct
- [x] Editing UX:
  - [x] Select an edge shows its control points
  - [x] Drag control points to reshape the polyline
  - [x] Add a new control point (e.g., double-click on edge segment)
  - [x] Remove a control point (e.g., Alt-click, right-click)
  - [x] Edge reconnection from Iteration A must continue to work and preserve points (or adjust endpoints only)
- [x] Constraints & guardrails:
  - [x] No simulation logic
  - [x] No external paid/proprietary packages for editable edges
  - [x] Keep implementation UI-only + DSL persistence (engine will ignore geometry)
- [x] Tests:
  - [x] DSL schema test: points serialize/deserialize correctly
  - [x] Minimal UI-level logic tests where feasible (or unit tests for helper functions that update points)

### DoD
- User can reshape an edge by adding/removing/dragging bend points.
- Points persist through export/import.
- Existing features from Iteration A remain intact (handles, reconnection, delete, directed edges).

---

## Iteration B0 — Backend Setup (Python/FastAPI + Validation)

**Goal:** set up backend infrastructure and move validation to server-side for real-time feedback.

### Deliverables
- [ ] `apps/backend`: Python FastAPI application structure
  - [ ] FastAPI app with WebSocket support
  - [ ] Project structure (api/, engine/, validation/, node_types/)
  - [ ] Development setup: `pnpm dev` runs both frontend and backend
- [ ] Port validation to backend:
  - [ ] DSL validation (Pydantic models matching TypeScript Zod schemas)
  - [ ] Connection validation (port `connectionValidator.ts` logic)
  - [ ] WebSocket endpoint for real-time validation
- [ ] Frontend integration:
  - [ ] WebSocket client for validation requests
  - [ ] Vite proxy configuration for backend API
  - [ ] Update UI to call backend for validation (node creation, edge creation)
- [ ] Type synchronization:
  - [ ] JSON Schema as source of truth (or manual Pydantic models)
  - [ ] Documentation on keeping types in sync

### DoD
- `pnpm dev` starts both frontend (Vite) and backend (uvicorn) concurrently
- Node/edge creation triggers backend validation via WebSocket
- Validation errors displayed in UI in real-time
- Backend validation logic matches TypeScript implementation

---

## Iteration B — Simulation MVP (Backend Engine + Step/Turn Model)

**Goal:** implement simulation engine on backend using step/turn model; frontend visualizes state updates.

### Deliverables
- [ ] Backend simulation engine (`apps/backend/src/engine/simulator.py`):
  - [ ] Turn/step execution model (see `docs/simulation-process.md`)
  - [ ] Node handler interface (`handle()` method)
  - [ ] Resource model and flow tracking
  - [ ] Deterministic RNG (seeded)
- [ ] Node type handlers in `apps/backend/src/node_types/core/`:
  - [ ] `core.Source`: emits resources at turn start
  - [ ] `core.Pool`: stores resources
  - [ ] `core.Drain`: consumes resources
  - [ ] `core.Gate`: conditional pass-through
  - [ ] `core.Converter`: transforms resources
  - [ ] `core.Trader`: exchanges resources
  - [ ] `core.RandomSplit`: weighted routing
- [ ] WebSocket API for simulation:
  - [ ] `start_simulation`: initialize with graph + settings
  - [ ] `step_simulation`: execute one step
  - [ ] `run_turn`: execute complete turn
  - [ ] `pause_simulation` / `reset_simulation`
  - [ ] Stream simulation state updates to frontend
- [ ] Frontend simulation UI:
  - [ ] Simulation toolbar (Run/Pause/Step/Reset)
  - [ ] WebSocket client for simulation control
  - [ ] State visualization:
    - [ ] Node counters (`stored_resources`, `consumed_resources`)
    - [ ] Token animation along edges
    - [ ] Turn/step counter display
- [ ] Golden test: run example graph for N turns and snapshot node states

### DoD
- Same seed + same graph => identical results (deterministic)
- Each node's `handle()` method executes on backend
- Frontend receives state updates via WebSocket and visualizes only
- Turn completes when step processes zero resource transfers
- See `docs/simulation-process.md` for detailed requirements

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