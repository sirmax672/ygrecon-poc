# ADR 003 — Use XYFlow (@xyflow/react) as the Graph Editor Foundation

Date: 2025-12-23  
Status: Accepted

## Context
We need a web-based node/edge editor with:
- custom nodes, multiple handles, reconnecting edges
- selection/delete, import/export
- extensibility for domain-specific node types

## Decision
Use XYFlow React (`@xyflow/react`) as the editor layer. Pin a compatible major version in the repo and treat XYFlow as a UI dependency only (no sim logic).

## Consequences
- UI behavior is aligned with XYFlow APIs (handles, reconnect, edge types).
- Engine remains UI-agnostic.
- If XYFlow introduces breaking changes, we handle them via planned upgrades (Change Log + ADR when needed).
