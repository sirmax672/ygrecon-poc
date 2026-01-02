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

## 2025-01-XX
- Change: Added UI Structure & Requirements section to docs/architecture.md and updated .cursorrules to require reading/updating UI documentation.
- Reason: Need clear documentation of UI layout hierarchy and component responsibilities for maintainability and consistency.
- Impact:
  - docs/architecture.md: Added "UI Structure & Requirements" section describing layout hierarchy, component responsibilities, and current implementation
  - .cursorrules: Updated rule 11 to explicitly mention UI requirements documentation
  - Current UI structure documented:
    - Header: Undo/Redo buttons + Import/Export component
    - Main Content Area (flex row):
      - Left: NodePalette (node type selection)
      - Center: Canvas (ReactFlow graph editor)
      - Right: RightPanel (tabbed interface with Inspector and DSL Viewer tabs)
- Migration/Notes:
  - No code changes required - this is documentation only
  - Future UI changes must update the "UI Structure & Requirements" section in docs/architecture.md
  - UI structure changes should also be logged in this changes.md file

## 2025-01-XX
- Change: Added backend architecture (Python/FastAPI) and moved simulation execution to backend. Changed simulation model from discrete-event to step/turn model.
- Reason: 
  - Need real-time validation on backend for security and consistency
  - Simulation execution on backend allows scaling to complex graphs
  - Step/turn model provides clearer semantics: turn = complete resource flow cycle, step = one iteration of node processing
- Impact:
  - docs/adr/005-backend-architecture.md: New ADR documenting backend architecture decision
  - docs/simulation-process.md: New document defining step/turn/handle requirements
  - docs/roadmap.md: 
    - Added Iteration B0 (Backend Setup + Validation)
    - Updated Iteration B (Simulation MVP) to use backend and step/turn model
  - docs/architecture.md: Added Backend Architecture section and updated Simulation Engine section
  - Repository structure: Added `apps/backend/` (to be implemented)
- Migration/Notes:
  - **Breaking change**: Simulation engine will be implemented in Python backend, not TypeScript
  - TypeScript `packages/sim` will remain as interface definitions for reference
  - Node types need Python implementations with `handle()` method (see `docs/simulation-process.md`)
  - Frontend becomes visualization-only; all simulation logic runs on backend
  - WebSocket protocol for communication (see ADR 005)
  - Development: `pnpm dev` will run both frontend and backend concurrently
  - Type synchronization: Use JSON Schema or manual sync between TypeScript and Python types
  - Simulation model change:
    - **Turn**: Complete cycle from Source nodes until no resources transferred
    - **Step**: One iteration processing all active nodes
    - Each node implements `handle(input_resources, outgoing_edges, node_state, rng) -> HandleResult`
    - Node state includes `stored_resources` and `consumed_resources` (visualization-only)

## 2025-01-XX
- Change: Updated WebSocket protocol to session-based model with incremental updates.
- Reason: 
  - Reduce network traffic (no full graph on each action)
  - Enable server-side state management
  - Prepare for multi-user collaboration
  - Better separation: frontend sends actions, backend maintains state
- Impact:
  - docs/adr/005-backend-architecture.md: Updated Communication Protocol section with session model
  - docs/websocket-protocol.md: New protocol specification document
  - docs/architecture.md: Updated API Protocol section
  - apps/backend/src/api/websocket.py: Need to implement session management and incremental actions
  - apps/web/src/services/websocket.ts: Need to send incremental actions instead of full graph
- Migration/Notes:
  - **Breaking change**: Protocol changed from "send full graph" to "send incremental actions"
  - Old protocol: Frontend sent full graph on `validate_connection`
  - New protocol: 
    - Frontend sends `create_node`/`create_edge`/`update_node`/`delete_node`/`delete_edge` actions
    - Backend maintains graph state in memory per session
    - Backend validates each action against current graph state
    - Session is created on WebSocket connect, destroyed on disconnect
    - Graph state is lost on disconnect (future: add persistence)
  - Frontend should send `get_graph` on reconnect to sync state
  - Validation now happens during `create_edge` action, not separate `validate_connection` call
  - `validate_connection` is still available for real-time feedback during edge dragging (does not modify graph)
  - Implementation:
    - `apps/backend/src/api/session.py`: Session management with in-memory graph storage
    - `apps/backend/src/api/websocket.py`: Updated to handle incremental actions
    - `apps/web/src/services/websocket.ts`: Updated to send incremental actions
    - `apps/web/src/App.tsx`, `apps/web/src/components/CustomNode.tsx`, `apps/web/src/components/NodePalette.tsx`: Updated to use new protocol