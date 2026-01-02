<!-- docs/architecture.md -->

# Architecture

This document is the **source of truth** for structure, boundaries, and contracts.

## Principles

1) **Docs are source of truth**
- Implementation must match this doc and `docs/roadmap.md`.
- Any deviation requires updating docs and recording in `docs/changes.md`.

2) **Separation of concerns**
- `apps/web` is UI only.
- `packages/sim` contains all simulation logic and is UI-agnostic.
- Node semantics live in node-type plugin packages.

3) **Determinism**
- Randomness must be seeded and routed through a single RNG interface.
- Same seed + same graph + same settings => same results.

4) **Extensibility**
- New node types are plugins registered in a registry.
- DSL is versioned and migratable.

---

## Repository Layout (pnpm monorepo)
```
/apps
/web # React UI
/packages
/dsl # Graph DSL schema, validation, migrations
/core # Registry, compiler, validation
/sim # Simulation engine + runtime state
/node-types-core # core.* node type plugins
/node-types-economy # example domain plugin (later)
/viz # UI-agnostic visualization helpers
/examples # example graphs + golden tests
/docs
roadmap.md
architecture.md
changes.md
/adr
```

### Dependency direction (must not violate)
- `dsl` is the lowest layer; imports nothing from above.
- `core` and `sim` depend on `dsl`.
- node-type packages depend on `dsl` + `sim` (and optionally `core` types if kept low-level).
- `apps/web` depends on everything, but nothing depends on `apps/web`.

No circular dependencies.

---

## Graph DSL

### Goals
- Declarative, versioned, validated.
- Plugin-friendly: unknown node types should be representable (but not executable without plugin).

### Canonical format
- Canonical storage: **JSON**.
- Human-friendly import/export: JSON (optional YAML later).

### Core structure (conceptual)
- `dslVersion: string` (e.g., `"0.2"`)
- `meta`: name, seed, description
- `nodes[]`: `{ id, type, params, position? }` (position is optional editor metadata)
- `edges[]`: `{ id, from, to, params }` (params may include sourceHandle, targetHandle, points for visualization)

### Validation
- Validate with Zod in `packages/dsl`.
- Provide structured errors:
  - `code` (e.g., `UNKNOWN_NODE_TYPE`, `MISSING_NODE_REF`)
  - `path` (e.g., `nodes[3].params.ratePerSec`)
  - `nodeId` / `edgeId` when applicable

### Versioning & migrations
- Any change to DSL schema bumps `dslVersion`.
- Migrations live in `packages/dsl/migrations`.
- Migrations are tested and documented in `docs/changes.md`.

---

## Node Type Plugins

### NodeTypeDefinition (conceptual contract)

Each node type plugin exports:
- `typeId: string` (namespaced, e.g., `core.Source`, `economy.Shop`)
- `display`: label, category, icon id (optional)
- `paramsSchema`: Zod schema for `params`
- `ports`: input/output port definitions (typed)
- `uiSchema`: form hints for inspector (labels, widgets, defaults)
- `validate?(graph, nodeId): ValidationIssue[]` optional node-level validation checks
- `validateConnection?(graph, fromNodeId, toNodeId, sourceHandle?, targetHandle?): ValidationIssue[]` optional connection validation
- `simulate`: semantics for the simulation engine

**Rule:** engine must not hardcode node type behavior. It calls plugins.

---

## Compiler

`packages/core` provides a compiler step:
- Input: validated DSL
- Output: runtime graph structure:
  - adjacency lists
  - node/edge lookup maps
  - precomputed port compatibility info (optional)
- Compiler also checks:
  - unique IDs
  - edges reference existing nodes
  - node types exist in registry (for execution; for pure edit mode, can be "unknown" but flagged)

## Connection Validation

`packages/core/src/connectionValidator.ts` validates edge connections:
- **Base rules** (structural):
  - No duplicate connections in the same direction between the same nodes
  - No reverse connections using handles already connected by an edge
- **Node-type-specific rules**: Delegated to node type plugins via optional `validateConnection` function
- Called from `compiler.ts` after basic structural validation but before building the compiled graph
- See `docs/adr/004-connection-validation-module.md` for details

---

## Simulation Engine

### Model
- Discrete-event simulation (event queue).
- Events include:
  - `TokenArriveNode`
  - `TransferStart`
  - `TransferComplete`
  - node-specific events (optional)

### Engine API (conceptual)
- `reset(compiledGraph, settings)`
- `step()` (process next event)
- `runForSteps(n)` / `runForMs(ms)`
- `pause()`
- `getState()`
- `subscribe(listener)` (optional)

### Runtime state (conceptual)
- `nodeState[nodeId]`: counters, resource balances, custom plugin state
- `edgeState[edgeId]`: queued transfers
- `tokens[]`: active tokens in transit (for UI animation)
- `log[]`: events emitted for debug

### Deterministic RNG
- RNG is seeded from `meta.seed` (or engine settings).
- Weighted routing and any randomness go through RNG only.

---

## Visualization Helpers

`packages/viz` is UI-agnostic and may provide:
- token motion interpolation (edge progress -> position)
- mapping runtime token state to renderable descriptors

`apps/web` can use XYFlow to render nodes/edges, and overlays tokens as SVG/HTML.

---

## UI Structure & Requirements

### Layout Hierarchy

The UI (`apps/web`) follows a fixed layout structure that must be maintained:

```
App (full viewport)
├── Header (top toolbar)
│   ├── Undo/Redo buttons
│   └── Import/Export component
├── Main Content Area (flex row, fills remaining height)
│   ├── Left Panel: Node Palette
│   │   └── List of available node types for drag-and-drop creation
│   ├── Center Panel: Canvas (ReactFlow)
│   │   └── Graph editor with nodes and edges
│   └── Right Panel: RightPanel (tabbed interface)
│       ├── Tab: Inspector
│       │   └── Parameter editor for selected node/edge
│       └── Tab: DSL Viewer
│           └── JSON view of current DSL state
```

### Component Responsibilities

- **Header**: Global actions (undo/redo, import/export)
- **NodePalette**: Node type selection and creation
- **Canvas**: Graph visualization and editing (ReactFlow-based)
- **RightPanel**: Tabbed interface for:
  - **Inspector**: Edit parameters of selected nodes/edges
  - **DSL Viewer**: Read-only JSON view of current DSL

### UI Requirements

1. **Separation**: UI must not contain simulation logic. All simulation logic lives in `packages/sim`.
2. **State Management**: UI state (nodes, edges, DSL) is managed via Zustand store (`apps/web/src/store/editorStore.ts`).
3. **DSL Sync**: UI must keep DSL in sync with visual graph state. Changes to nodes/edges update DSL via `xyFlowToDSL` converter.
4. **Validation**: UI validates connections before creating/updating edges using `validateConnections` from `@ygrecon/core`.
5. **Extensibility**: New UI panels should follow the existing structure. If adding new tabs to RightPanel, update this documentation.

### Current Implementation

- **Header**: `apps/web/src/App.tsx` (lines ~450-480)
- **NodePalette**: `apps/web/src/components/NodePalette.tsx`
- **Canvas**: `apps/web/src/App.tsx` (Canvas component, lines ~41-441)
- **RightPanel**: `apps/web/src/components/RightPanel.tsx`
  - **Inspector**: `apps/web/src/components/Inspector.tsx`
  - **DSL Viewer**: `apps/web/src/components/DSLViewer.tsx`
- **ImportExport**: `apps/web/src/components/ImportExport.tsx`

### UI Change Requirements

When modifying UI structure:
1. Update this section to reflect the new structure
2. Update `docs/changes.md` with the change
3. Ensure layout remains responsive and accessible

---

## Documentation & change tracking (mandatory)

- `docs/changes.md` is an append-only log of requirement changes / scope clarifications.
- `docs/adr/*` records architectural decisions.
- Every iteration updates `docs/roadmap.md` checkboxes.