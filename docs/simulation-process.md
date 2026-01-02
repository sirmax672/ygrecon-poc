<!-- docs/simulation-process.md -->

# Simulation Process Requirements

This document defines the **source of truth** for how simulation works: step/turn model, node handling, and state management.

## Core Concepts

### Turn

A **turn** is a complete cycle of resource flow through the graph:
- **Start**: First step processes all `Source` nodes (emit resources)
- **End**: Turn completes when a step processes **zero resource transfers** (no nodes emitted, stored, or consumed resources)

A turn represents one "tick" of the simulation where resources flow from sources through the graph until they reach sinks or are stored.

### Step

A **step** is one iteration of processing active nodes:
- Processes all nodes that have **input resources** (resources waiting to be handled)
- Each node's `handle()` method is called with:
  - Input resources (resources that arrived at this node)
  - Outgoing connections (edges from this node to others)
- Node can:
  - **Emit** resources to connected nodes (via edges)
  - **Store** resources (add to node's stored resources)
  - **Consume** resources (remove from simulation, add to consumed count)

After all active nodes are processed, if any resources were emitted, the next step begins. If zero resources were transferred, the turn ends.

### Node Handle Method

Every node type must implement a `handle()` method on the backend:

```python
def handle(
    self,
    node_id: str,
    input_resources: List[Resource],
    outgoing_edges: List[Edge],
    node_state: NodeState,
    rng: RNG
) -> HandleResult:
    """
    Process input resources for this node.
    
    Args:
        node_id: ID of this node
        input_resources: Resources that arrived at this node (from incoming edges)
        outgoing_edges: All edges from this node to other nodes
        node_state: Current state of this node (counters, stored resources, etc.)
        rng: Seeded random number generator for deterministic randomness
    
    Returns:
        HandleResult containing:
        - emitted: List[EmittedResource] - resources to send to other nodes
        - stored: int - amount of resources to add to stored count
        - consumed: int - amount of resources to remove (consumed)
    """
```

### Resource Model

```python
class Resource:
    """Represents a resource unit in the simulation."""
    id: str
    type: str  # e.g., "gold", "wood", "token"
    amount: float  # quantity (can be fractional for rates)
    metadata: dict  # optional additional data
```

### HandleResult

```python
class HandleResult:
    """Result of a node's handle() method."""
    emitted: List[EmittedResource]  # Resources to send to other nodes
    stored: float  # Amount to add to node's stored resources
    consumed: float  # Amount consumed (removed from simulation)
    
class EmittedResource:
    """Resource being sent to another node."""
    resource: Resource
    target_node_id: str
    edge_id: str  # Which edge to use (for multi-edge routing)
```

## Simulation Flow

### Turn Execution

```
1. Start Turn
   ├─> Step 1: Process all Source nodes
   │   └─> Each Source.handle() emits resources
   │
   ├─> Step 2: Process nodes that received resources in Step 1
   │   └─> Each node.handle() processes input resources
   │
   ├─> Step N: Process nodes that received resources in Step N-1
   │   └─> Continue until no resources are transferred
   │
   └─> Turn Complete (no resources transferred in last step)
```

### Step Execution

```
For each step:
1. Collect all nodes with input_resources > 0
2. For each active node:
   a. Call node.handle(input_resources, outgoing_edges, node_state, rng)
   b. Apply HandleResult:
      - Emit resources to target nodes (add to their input_resources queue)
      - Add to node's stored_resources
      - Add to node's consumed_resources
3. If any resources were emitted → continue to next step
4. If zero resources emitted → turn ends
```

## Node State During Simulation

Each node maintains simulation-specific state (separate from DSL params):

```python
class NodeSimulationState:
    """Runtime state for a node during simulation."""
    stored_resources: float  # Resources currently stored in this node
    consumed_resources: float  # Total resources consumed by this node (cumulative)
    input_resources: List[Resource]  # Resources waiting to be processed
    counters: dict[str, float]  # Custom counters (plugin-specific)
    metadata: dict  # Additional plugin-specific state
```

**Important**: `stored_resources` and `consumed_resources` are **only for visualization** on the frontend. They do not affect simulation logic directly (they are outputs of `handle()`, not inputs).

## Example: Source Node

```python
def handle(self, node_id, input_resources, outgoing_edges, node_state, rng):
    # Source nodes ignore input_resources (they generate their own)
    params = node_state.params  # e.g., {"rate": 10}
    
    # Generate resources based on params
    amount = params.get("rate", 1)
    resources = [Resource(id=..., type="token", amount=amount)]
    
    # Emit to all outgoing edges (or use weighted routing)
    emitted = []
    for edge in outgoing_edges:
        emitted.append(EmittedResource(
            resource=resources[0],  # or split resources
            target_node_id=edge.to,
            edge_id=edge.id
        ))
    
    return HandleResult(
        emitted=emitted,
        stored=0,
        consumed=0
    )
```

## Example: Pool Node

```python
def handle(self, node_id, input_resources, outgoing_edges, node_state, rng):
    # Pool stores all incoming resources
    total_input = sum(r.amount for r in input_resources)
    
    # Optionally emit to outgoing edges (if pool has capacity logic)
    emitted = []
    # ... routing logic ...
    
    return HandleResult(
        emitted=emitted,
        stored=total_input,  # Add to stored_resources
        consumed=0
    )
```

## Example: Drain Node

```python
def handle(self, node_id, input_resources, outgoing_edges, node_state, rng):
    # Drain consumes all incoming resources
    total_input = sum(r.amount for r in input_resources)
    
    return HandleResult(
        emitted=[],  # No outgoing edges (drain is a sink)
        stored=0,
        consumed=total_input  # Remove from simulation
    )
```

## Determinism

- Same graph + same seed + same settings = identical results
- All randomness must use the provided `rng` (seeded)
- Node processing order within a step must be deterministic (e.g., by node ID)

## State Updates to Frontend

After each step, backend sends updated state:

```json
{
  "type": "simulation_state",
  "payload": {
    "turn": 1,
    "step": 3,
    "nodes": {
      "node-1": {
        "stored_resources": 50.0,
        "consumed_resources": 0.0,
        "counters": {"balance": 50.0}
      },
      "node-2": {
        "stored_resources": 0.0,
        "consumed_resources": 25.0,
        "counters": {}
      }
    },
    "tokens": [
      {
        "id": "token-1",
        "edge_id": "edge-1",
        "progress": 0.5,
        "resource": {"type": "token", "amount": 1.0}
      }
    ]
  }
}
```

Frontend uses this state **only for visualization**:
- Display `stored_resources` on nodes
- Display `consumed_resources` on nodes
- Animate `tokens` moving along edges
- Update counters

Frontend does **not** execute simulation logic.

