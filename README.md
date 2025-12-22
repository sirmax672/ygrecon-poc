<!-- README.md -->

# Game Economy Graph Simulator (Machinations-like)

A web application to **construct**, **validate**, and **simulate** a Machinations-inspired economy graph.
You can build graphs from typed blocks (sources, pools/stocks, drains, processors), run deterministic simulations, and visualize token flow along edges.

## Key Goals
- **Open-source** architecture and plugin-friendly node types
- **Deterministic simulation** with seeded randomness
- Clear separation between **UI** and **simulation engine**
- A versioned, migratable **Graph DSL**

## Documentation (Source of Truth)
- `docs/roadmap.md` — iteration plan + DoD checklists (**source of truth for scope**)
- `docs/architecture.md` — module boundaries + contracts (**source of truth for architecture**)
- `docs/changes.md` — append-only requirement/scope change log
- `docs/adr/` — architectural decision records

## Monorepo Structure (pnpm)
```
/apps/web
/packages/dsl
/packages/core
/packages/sim
/packages/node-types-core
/packages/viz
/packages/examples
/docs
```

## Tech Stack
- UI: React + TypeScript + Vite
- Graph editor: XYFlow (`@xyflow/react`)
- DSL validation: Zod
- Simulation: discrete-event engine (event queue)

## Quickstart

### 1) Install
```bash
pnpm i
```
### 2) Run the web app
```bash
pnpm dev
```

### Run tests / typecheck
```bash
pnpm test
pnpm typecheck
```

## Scripts (recommended)

`pnpm dev` — run apps/web

`pnpm test` — run all package tests

`pnpm typecheck` — strict TS across workspace

`pnpm lint` — lint workspace

(Exact script definitions live in the root package.json.)

# Development Workflow
## Iterations

Work in the order specified in docs/roadmap.md.
Each iteration must:

1. implement the deliverables
1. add/adjust tests
1. update docs (roadmap checkboxes + change log if needed)

## Requirement changes

If requirements change or are clarified:
1. Add an entry to docs/changes.md
1. If architectural: add an ADR in docs/adr/

## Adding a New Node Type (Plugin)

Node types are plugins. The engine must not hardcode node semantics.

### 1) Create a module in a node-type package

Example path:
`packages/node-types-economy/src/shop.ts`

The module should export:
- typeId (e.g., economy.Shop)
- paramsSchema (Zod)
- ports (inputs/outputs)
- uiSchema (inspector hints)
- simulate() (semantics)

### 2) Register the node type

Export it from the package index (registry aggregation).

### 3) Add tests

- Unit tests for simulate()
- If behavior is significant, add/extend a golden test in packages/examples

### 4) Ensure docs remain accurate

If you changed DSL fields, bump version + add migration + update docs.

## Determinism

All randomness must go through seeded RNG.
To reproduce a simulation run, capture:

- graph DSL JSON
- seed
- engine settings

# License

TBD (choose an OSI-approved license, e.g., MIT or Apache-2.0).