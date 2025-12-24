<!-- docs/changes.md -->

# Change Log

This is an **append-only** log.
Add an entry whenever requirements change, scope is clarified, or implementation deviates from existing docs.

Template:

## YYYY-MM-DD
- Change:
- Reason:
- Impact:
- Migration/Notes:

---

## 2025-12-23
- Change: Initial project documents created (roadmap, architecture, ADR template).
- Reason: Establish source-of-truth documentation and sustainable development workflow.
- Impact: docs/*, .cursorrules, repo structure.
- Migration/Notes: N/A

## 2025-01-XX
- Change: Iteration 0 implemented with DSL v0.2 (instead of v0.1 as originally planned in roadmap).
- Reason: Example graph provided uses v0.2 schema; starting with v0.2 avoids immediate migration work.
- Impact: packages/dsl (schema version), docs/roadmap.md (updated to reflect v0.2).
- Migration/Notes: No migration needed as this is the initial version. Future versions will require migration functions.

## 2025-01-XX
- Change: Iteration A — Editor MVP completed. Implemented XYFlow-based graph editor with node palette, inspector, import/export, and validation.
- Reason: Core editor functionality needed before simulation features.
- Impact: apps/web (complete editor implementation), packages/core (compiler validation tests), docs/roadmap.md (checkboxes updated).
- Migration/Notes: N/A. Editor uses Zustand for state management with undo/redo support. Node types are loaded from registry (no hardcoded UI lists). Edge handles (ports) are persisted in DSL via `sourceHandle`/`targetHandle` in edge params.

## 2025-01-XX
- Change: Added connection validation module (`packages/core/src/connectionValidator.ts`) with base rules and plugin extension point.
- Reason: Need to validate edge connections to prevent semantic errors (duplicate connections, reverse connections on same handles, node-type-specific rules).
- Impact: packages/core (new connectionValidator module, updated compiler.ts, extended NodeTypeDefinition with validateConnection), docs/architecture.md, docs/adr/004-connection-validation-module.md.
- Migration/Notes: 
  - Base validation rules: no duplicate connections in same direction, no reverse connections on same handles.
  - Node types can now optionally export `validateConnection` function to enforce type-specific rules (e.g., Source can only have outgoing edges).
  - Validation is called automatically during compilation. Existing graphs will be validated on next compile.
  - See ADR 004 for architectural details.

## 2025-01-XX
- Change: Iteration A2 — Editable Edge Geometry implemented. Added polyline edge type with editable bend points.
- Reason: Users need manual control over edge geometry for better diagram layout and clarity.
- Impact: 
  - apps/web: New `PolylineEdge` and `ClickableBaseEdge` components, updated `dslConverter` to handle points
  - packages/dsl: Added tests for points serialization/deserialization
  - Edge geometry persisted in `edge.params.points` as `Array<{ x: number; y: number }>`
- Migration/Notes:
  - Existing edges without points continue to work as before (default edge type)
  - When points are added to an edge (via double-click), edge type automatically changes to `polyline`
  - Points are stored in `edge.params.points` in DSL and `edge.data.points` in ReactFlow state
  - Edge reconnection preserves existing points (only endpoints change)
  - Control points are only visible when edge is selected
  - Double-click on edge segment adds a new control point
  - Right-click on control point removes it
  - Drag control points to reshape the polyline
  - See ADR 002 for architectural details

## 2025-01-XX
- Change: Added visualization data to DSL: node positions and edge handles.
- Reason: DSL should preserve all editor state for round-trip import/export, including visualization layout.
- Impact:
  - packages/dsl: Updated GraphDSL type and schema to include optional `position: { x, y }` in nodes
  - apps/web: Updated `dslConverter` to save/load node positions and edge handles (sourceHandle, targetHandle)
  - packages/examples: Updated example DSL file with positions and handles
- Migration/Notes:
  - `node.position` is optional in DSL v0.2 - existing graphs without positions will work (defaults to { x: 0, y: 0 })
  - Edge handles (`sourceHandle`, `targetHandle`) are stored in `edge.params` for visualization
  - All visualization data is preserved through export/import cycles
  - This is editor metadata - simulation engine ignores positions and handles