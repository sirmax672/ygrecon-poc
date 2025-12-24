# ADR 002 — Persist Edge Geometry as Polyline Bend Points

Date: 2025-12-23  
Status: Accepted

## Context
The editor must allow users to manually control edge geometry:
- straight segments with bend points (polyline)
- add/remove/drag control points
- geometry must persist across export/import

The simulation engine does not need edge geometry, but the UI and DSL should round-trip it reliably.

## Decision
Introduce a custom edge type `polyline` and persist its geometry as:
- `edge.data.points: Array<{ x: number; y: number }>` in canvas coordinates

Rules:
- The rendered path is: source -> points[] -> target (straight segments).
- Reconnecting an edge changes endpoints but preserves `points[]` unless explicitly edited.
- Geometry is treated as **editor-only metadata**; the simulation engine ignores it.

## Alternatives Considered
1) Do not persist geometry; recompute routes automatically
- Pros: simpler DSL
- Cons: user loses manual edits; hard to achieve desired diagrams

2) Persist geometry as relative offsets or normalized coordinates
- Pros: potentially robust to layout changes
- Cons: more complexity; unclear benefit for MVP

3) Use a proprietary “editable edge” library/package
- Rejected (must remain open-source and avoid paid/proprietary dependencies).

## Consequences
- DSL now contains optional editor metadata for edge geometry.
- Import/export becomes stable for diagram shape.
- We must ensure schema validation accepts `edge.data.points` and UI updates it safely.
- Future: if we add auto-layout, we must decide whether to preserve or regenerate points (tracked in Change Log if/when introduced).
