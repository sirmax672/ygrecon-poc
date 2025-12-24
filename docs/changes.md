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