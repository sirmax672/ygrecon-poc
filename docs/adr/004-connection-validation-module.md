# ADR 004 — Connection Validation Module

Date: 2025-01-XX  
Status: Accepted

## Context
We need to validate edge connections in the graph to ensure semantic correctness:
- Prevent duplicate connections between nodes in the same direction
- Prevent reverse connections using the same handles already connected by an edge
- In the future, validate node-type-specific connection rules (e.g., Source can only have outgoing edges, Drain can only have incoming edges)

The validation should be:
- Extensible: new rules can be added without modifying core logic
- Plugin-aware: node types can define their own connection validation rules
- Called at the right time: after basic structural validation (node/edge refs) but before compilation

## Decision
Create a dedicated connection validation module `packages/core/src/connectionValidator.ts` that:
1. Performs **base-level connection rules** (structural checks):
   - No duplicate connections in the same direction between the same nodes
   - No reverse connections using handles already connected by an edge
2. Delegates **node-type-specific validation** to node type plugins via an optional `validateConnection` function in `NodeTypeDefinition`
3. Is called from `compiler.ts` after basic structural validation (duplicate IDs, missing refs) but before building the compiled graph

### Base Rules
1. **No duplicate direction**: If edge `A -> B` exists, cannot create another edge `A -> B` (regardless of handles)
2. **No reverse on same handles**: If edge `A[handleX] -> B[handleY]` exists, cannot create edge `B[handleY] -> A[handleX]`

### Node Type Plugin Extension
Each node type can optionally export:
```typescript
validateConnection?: (
  graph: GraphDSL,
  fromNodeId: string,
  toNodeId: string,
  sourceHandle?: string,
  targetHandle?: string
) => ValidationIssue[]
```

This allows node types to enforce rules like:
- `core.Source`: cannot have incoming edges
- `core.Drain`: cannot have outgoing edges
- `core.Pool`: can have both, but might restrict certain handle combinations

## Alternatives Considered
1) Put all validation in `compiler.ts`
   - Pros: simpler structure, everything in one place
   - Cons: compiler becomes bloated; harder to test rules in isolation; violates separation of concerns

2) Put validation in `packages/dsl/validate.ts`
   - Pros: all DSL validation in one place
   - Cons: DSL layer should only validate structure, not business logic; would create circular dependency (DSL would need to import core registry)

3) Put validation in UI layer (`apps/web`)
   - Pros: immediate feedback during editing
   - Cons: validation logic would be in UI, violating separation of concerns; validation wouldn't run on imported DSL files

4) Separate validation package
   - Pros: clear separation
   - Cons: over-engineering for current scope; adds unnecessary package boundary

## Consequences
- `compiler.ts` becomes cleaner: delegates connection validation to a dedicated module
- Connection rules are testable in isolation
- Node types can extend validation without modifying core logic
- Validation happens at compile time, so imported DSL files are validated
- Future: UI can call the same validator for real-time feedback during editing (by importing from `@ygrecon/core`)
- The validator needs access to node type registry to call plugin validation functions
- Handles are stored in `edge.params.sourceHandle` and `edge.params.targetHandle` (optional strings)

