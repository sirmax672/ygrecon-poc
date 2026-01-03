<!-- docs/adr/005-backend-architecture.md -->

# ADR 005 — Backend Architecture (Python/FastAPI)

Date: 2025-01-XX  
Status: Accepted

## Context

We need to:
1. Move validation logic to backend for real-time validation as users create nodes/edges
2. Move simulation execution to backend (all node processing happens server-side)
3. Provide fast communication between frontend and backend
4. Support future scalability for complex simulations

Current architecture has all logic in TypeScript packages running in the browser. We need a backend that:
- Validates node creation and connections in real-time
- Executes simulation steps (each node's `handle` method runs on backend)
- Streams simulation state updates to frontend for visualization
- Maintains separation: frontend is visualization-only

## Decision

Implement backend using **Python + FastAPI**:
- **FastAPI** for HTTP/WebSocket API with low latency
- **WebSocket** for real-time bidirectional communication (validation + simulation streaming)
- **Pydantic** for DSL validation (compatible with TypeScript Zod schemas via JSON Schema)
- **asyncio** for concurrent simulation handling
- Backend runs in `apps/backend/` as part of the monorepo

### Architecture Layers

```
apps/backend/
  src/
    main.py              # FastAPI app entry point
    api/
      websocket.py       # WebSocket endpoint for validation + simulation
      session.py         # Session management (session = graph state)
      validation.py      # REST endpoints (optional, WebSocket preferred)
    engine/
      simulator.py       # Simulation engine (step/turn logic)
      types.py           # Python types matching TypeScript
    validation/
      dsl_validator.py  # DSL validation (Pydantic)
      connection_validator.py  # Connection validation
    node_types/
      base.py            # Base node handler interface
      core/               # Core node type handlers
        source.py
        pool.py
        drain.py
        ...
    shared/
      dsl_schema.py      # Pydantic models for DSL (synced with TypeScript)
```

### Communication Protocol

**Session Model:**
- Each WebSocket connection = one session
- One session = one project (graph) — 1:1 relationship
- Backend maintains graph state in memory per session
- Frontend sends **incremental actions** (create node, create edge, update, delete)
- Frontend does NOT send full graph on each action
- Session is created on connect, destroyed on disconnect

**WebSocket Messages:**

Frontend → Backend:
- `create_node`: Add new node to graph
- `update_node`: Update node parameters
- `delete_node`: Remove node from graph
- `create_edge`: Add new edge to graph (with validation)
- `update_edge`: Update edge parameters
- `delete_edge`: Remove edge from graph
- `get_graph`: Request current graph state
- `start_simulation`: Start simulation with current graph state
- `step_simulation`: Execute one step
- `pause_simulation`: Pause running simulation
- `reset_simulation`: Reset simulation state

Backend → Frontend:
- `session_created`: Session initialized (sent on connect)
- `node_created`: Node creation confirmed
- `node_updated`: Node update confirmed
- `node_deleted`: Node deletion confirmed
- `edge_created`: Edge creation confirmed (includes validation result)
- `edge_updated`: Edge update confirmed
- `edge_deleted`: Edge deletion confirmed
- `graph_state`: Current graph state (response to `get_graph`)
- `simulation_state`: Updated simulation state (nodeState, tokens, etc.)
- `error`: Error message

See `docs/websocket-protocol.md` for complete message specification.

**Session Management:**
- Session is created automatically on WebSocket connect
- Session stores graph state in memory (`Session` class in `apps/backend/src/api/session.py`)
- Graph state is lost on disconnect (future: add persistence to database/Redis)
- Frontend sends incremental actions; backend validates and updates graph state
- No full graph transmission except on `get_graph` request

### Development Workflow

- `pnpm dev` runs both frontend (Vite) and backend (uvicorn) concurrently
- Vite proxy forwards `/api` and `/ws` to backend (localhost:8000)
- Backend auto-reloads on Python file changes (uvicorn --reload)

## Alternatives Considered

1) **Node.js/TypeScript backend**
   - Pros: Shared code with frontend, same language
   - Cons: Slower for CPU-intensive simulations, less ecosystem for numerical work

2) **Go/Rust backend**
   - Pros: Very fast, excellent concurrency
   - Cons: Higher learning curve, less ecosystem for validation/schema work

3) **Keep everything in browser**
   - Pros: Simpler deployment, no backend needed
   - Cons: Cannot scale to complex simulations, validation happens client-side (security concern)

## Consequences

### Positive
- Fast validation feedback (WebSocket latency < 10ms typically)
- Simulation can scale to complex graphs without browser performance limits
- Centralized validation logic (security, consistency)
- Can add features like simulation history, replay, multi-user collaboration later

### Negative
- Need to maintain type sync between TypeScript and Python (mitigated by JSON Schema)
- More complex development setup (two processes)
- Network latency for simulation updates (mitigated by WebSocket streaming)

### Migration Path
1. **Phase 1**: Port validation to backend, frontend calls backend for validation
2. **Phase 2**: Implement session-based protocol with incremental updates
3. **Phase 3**: Port simulation engine to backend, frontend only visualizes
4. **Phase 4**: Add advanced features (history, replay, collaboration, persistence)

### Type Synchronization Strategy
- Use JSON Schema as source of truth
- Generate Pydantic models from JSON Schema (or vice versa)
- Or: manually maintain Pydantic models and validate they match TypeScript types in CI

