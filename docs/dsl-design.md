<!-- docs/dsl-design.md -->

# DSL Design & Requirements

This document captures design ideas, requirements, and notes about the DSL structure, node types, connections, and semantics.

**Status:** Living document — add ideas and notes as they emerge.

---

## Design Principles

- The DSL describes project properties, such as metadata, global variables, and resource types.
- The DSL also specifies one or more calculation graphs, which represent what is shown in the editor: nodes and edges. These graphs can form a single connected component or several independent subgraphs.
- Each node and edge has two categories of properties:
    - Semantic properties: required for calculation and simulation (e.g., logic/configuration).
    - Visual/editor properties: used only for visualization and editor state (e.g., position, color, shape, port order). These do not affect simulation.
- Visual/editor properties must be separated from semantic (simulation) properties, so that changing the appearance does not affect calculation results.
- The DSL structure must allow extension with new resource types, node types, and node/edge properties without breaking backwards compatibility.
- All DSL objects must explicitly conform to the expected schema for the given DSL version, allowing for runtime validation and clear structure.

---

## Object Types & Semantics

### Core Objects

#### Nodes

Based on Machinations.io documentation, the following node types are used:

**1. Pool (Хранилище)**
- **Purpose:** Collects and stores resources. Represents a container that can accumulate resources over time.
- **Semantic Properties:**
  - `resourceId` (string): Type of resource stored in this pool
  - `initial` (number, optional): Initial amount of resources in the pool
  - `capacity` (number, optional): Maximum capacity of the pool (if not specified, unlimited)
  - `activationMode` (enum, optional): When the pool activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling (does not affect simulation)

**2. Source (Источник)**
- **Purpose:** Generates and creates resources in the system. Produces resources at a specified rate or on demand.
- **Semantic Properties:**
  - `resourceId` (string): Type of resource generated
  - `mode` (enum, optional): Generation mode - "interval" (periodic) or "instant" (one-time)
  - `intervalMs` (number, optional): Time interval between generations (for interval mode)
  - `amount` (number, optional): Amount of resources generated per activation
  - `productionRate` (number, optional): Alternative to amount/interval - resources per time unit
  - `activationMode` (enum, optional): When the source activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**3. Drain (Сток/Слив)**
- **Purpose:** Consumes and removes resources from the system. Destroys resources that flow into it.
- **Semantic Properties:**
  - `resourceId` (string, optional): Type of resource consumed (if filtering is needed)
  - `consumptionRate` (number, optional): Amount of resources consumed per activation
  - `activationMode` (enum, optional): When the drain activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**4. Converter (Преобразователь/Конвертер)**
- **Purpose:** Transforms one type of resource into another type. Takes input resources and produces output resources.
- **Semantic Properties:**
  - `inputResourceId` (string): Type of resource accepted as input
  - `outputResourceId` (string): Type of resource produced as output
  - `conversionRate` (number): Conversion ratio (e.g., 2 means 1 input = 2 output)
  - `activationMode` (enum, optional): When the converter activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**5. Trader (Обменник)**
- **Purpose:** Exchanges resources of one type for resources of another type. Similar to converter but with explicit offer/request semantics.
- **Semantic Properties:**
  - `offerResourceId` (string): Type of resource offered
  - `offerAmount` (number): Amount of offered resources required
  - `requestResourceId` (string): Type of resource requested
  - `requestAmount` (number): Amount of requested resources provided
  - `activationMode` (enum, optional): When the trader activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**6. Gate (Ворота/Гейт)**
- **Purpose:** Controls and distributes resource flow between multiple paths. Can route resources probabilistically or deterministically.
- **Semantic Properties:**
  - `distributionMode` (enum): "deterministic" (fixed weights) or "probabilistic" (random based on weights)
  - `weights` (array of numbers): Weight coefficients for each output path (for weighted distribution)
  - `condition` (string, optional): Condition expression that must be true for gate to pass resources
  - `activationMode` (enum, optional): When the gate activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**7. RandomSplit (Случайное разделение)**
- **Purpose:** Splits incoming resources randomly across multiple output paths based on weights.
- **Semantic Properties:**
  - `weights` (array of numbers): Weight coefficients for each output path
  - `consumeInput` (boolean, optional): Whether input resource is consumed when splitting
  - `activationMode` (enum, optional): When the split activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**Activation Modes:**
- `automatic` / `automatically`: Node activates on every time step
- `interactive`: Node activates only when user interacts with it
- `onStart`: Node activates once at simulation start
- `onReceive`: Node activates when it receives resources

#### Edges/Connections

**1. Resource Connection (Ресурсная связь)**
- **Purpose:** Defines how resources flow between nodes. Moves resources from source node to target node.
- **Semantic Properties:**
  - `from` (nodeId): Source node ID
  - `to` (nodeId): Target node ID
  - `flowRate` (number, optional): Rate of resource flow (resources per time unit)
  - `batch` (number, optional): Batch size - how many resources move per transfer
  - `delayMs` (number, optional): Delay before resources arrive at target
  - `weight` (number, optional): Weight for probabilistic routing (when multiple edges from same node)
  - `label` (string, optional): Label/expression that determines flow behavior (e.g., "D6" for dice roll)
  - `condition` (string, optional): Condition expression - connection only active when condition is true
  - `outResourceId` (string, optional): Resource type transformation on edge (if different from source)
- **Visual Properties:**
  - `sourceHandle`, `targetHandle`: Which ports/handles are connected
  - `points`: Polyline bend points for edge geometry
  - `color`, `style`: Visual styling

**2. State Connection (Связь состояний)**
- **Purpose:** Changes state of nodes or edges based on conditions. Transmits state information rather than resources.
- **Semantic Properties:**
  - `from` (nodeId): Source node ID
  - `to` (nodeId): Target node ID or edge ID
  - `condition` (string): Condition expression that must be true for state change
  - `effect` (string): Effect description - what state change occurs (e.g., "activate", "setRate")
  - `targetProperty` (string, optional): Which property of target is modified
- **Visual Properties:**
  - `sourceHandle`, `targetHandle`: Which ports/handles are connected
  - `points`: Polyline bend points
  - `color`, `style`: Visual styling (typically different from resource connections)

**3. Trigger Connection (Триггерная связь)**
- **Purpose:** Activates a node when certain conditions are met. Used for event-driven activation.
- **Semantic Properties:**
  - `from` (nodeId): Source node ID
  - `to` (nodeId): Target node ID
  - `triggerCondition` (string): Condition expression that triggers activation
  - `effect` (string, optional): What happens when triggered (e.g., "activate", "deactivate")
- **Visual Properties:**
  - `sourceHandle`, `targetHandle`: Which ports/handles are connected
  - `points`: Polyline bend points
  - `color`, `style`: Visual styling

#### Resources

Resources are defined at the graph level in the `resources` array:
- `id` (string): Unique identifier for the resource type
- `label` (string): Human-readable name for the resource

Resources are referenced by `resourceId` in nodes and edges. Resources represent game elements such as currency, health points, experience, items, etc.

---

## Editable Properties

### Node Properties

All semantic properties described in the [Node Types](#nodes) section above are editable for each node type. See the detailed property lists for each node type (Pool, Source, Drain, Converter, Trader, Gate, RandomSplit) in the "Object Types & Semantics" section.

Visual properties (position, color, shape) are also editable but do not affect simulation.

### Edge Properties

All semantic properties described in the [Edge Types](#edgesconnections) section above are editable for each edge type. See the detailed property lists for each edge type (Resource Connection, State Connection, Trigger Connection) in the "Object Types & Semantics" section.

Visual properties (sourceHandle, targetHandle, points, color, style) are also editable but do not affect simulation.

### Graph-Level Properties

Editable at graph level:
- `meta.name` (string): Graph name
- `meta.seed` (number): Random seed for deterministic simulation
- `meta.timeUnit` (string, optional): Time unit description (e.g., "ms", "seconds")
- `meta.notes` (string, optional): User notes about the graph
- `resources[]`: Array of resource definitions (can add/remove/edit resource types)

---

## Connection Rules & Constraints

### Allowed Connections

**Resource Connections:**
- **Source** → **Pool**: Source generates resources into a pool
- **Source** → **Converter**: Source provides input to converter
- **Source** → **Drain**: Source can feed directly into drain (rare use case)
- **Pool** → **Pool**: Resources can flow between pools
- **Pool** → **Drain**: Pool resources are consumed by drain
- **Pool** → **Converter**: Pool provides input to converter
- **Pool** → **Trader**: Pool provides resources for trading
- **Pool** → **Gate**: Pool feeds into gate for distribution
- **Pool** → **RandomSplit**: Pool feeds into random splitter
- **Converter** → **Pool**: Converter output goes to pool
- **Converter** → **Drain**: Converter output can go to drain
- **Trader** → **Pool**: Trader output goes to pool
- **Gate** → **Pool**: Gate distributes to multiple pools
- **Gate** → **Drain**: Gate can route to drain
- **RandomSplit** → **Pool**: Split outputs go to pools
- **RandomSplit** → **Drain**: Split outputs can go to drain

**State Connections:**
- Can connect any node to any other node or edge
- Used to modify node/edge properties based on conditions
- Typically connects nodes that need to influence each other's state

**Trigger Connections:**
- Can connect any node to any other node
- Used for event-driven activation
- Source node's state triggers activation of target node

### Forbidden Connections

**Resource Connections:**
- **Drain** → **Any node**: Drains only consume, they cannot output resources
- **Source** → **Source**: Sources cannot connect to each other (no resource flow between sources)
- Self-loops on **Source** or **Drain** are typically invalid (but may be allowed for special cases)

**General Rules:**
- Connections must respect node port definitions (inputs vs outputs)
- A node with no input ports (like Source) cannot receive resource connections as input
- A node with no output ports cannot send resource connections as output
- Duplicate connections in the same direction between the same nodes are forbidden (see connection validation)

### Connection Semantics

**Resource Connection Semantics:**
- Resources flow from source node to target node
- Flow rate determines how many resources move per time unit
- Batch size determines how many resources move per transfer event
- Delay adds time before resources arrive at target
- Weight is used for probabilistic routing when multiple edges exist from same source
- Label/expression can modify flow behavior (e.g., dice roll "D6" generates 1-6 resources)
- Condition makes connection active only when condition is true
- `outResourceId` allows resource type transformation on the edge

**State Connection Semantics:**
- Does not transfer resources, only state information
- When condition is met, applies effect to target node/edge
- Can modify node properties (e.g., change activation mode, change rate)
- Can modify edge properties (e.g., enable/disable edge, change flow rate)

**Trigger Connection Semantics:**
- When trigger condition is met, activates target node
- Used for event-driven behavior
- Does not transfer resources

### Port/Handle Rules

- Each node defines input and output ports (handles)
- Resource connections must connect output port of source node to input port of target node
- State and trigger connections can connect any ports (semantics depend on connection type)
- Multiple edges can connect from the same output port (for distribution)
- Multiple edges can connect to the same input port (for aggregation)
- Ports are identified by handle IDs (e.g., "left-1", "right-1", "top-1", "bottom-1")
- Handle positions are visual/editor properties and do not affect simulation logic

---

## Notes from Reference Product

### 2025-01-XX - Machinations.io Node Types Research
- Based on research of Machinations.io documentation and game design tooling:
  - Core node types: Pool, Source, Drain, Converter, Trader, Gate
  - Additional node type: RandomSplit (for probabilistic routing)
  - Three connection types: Resource Connection, State Connection, Trigger Connection
  - Activation modes control when nodes activate: automatic, interactive, onStart, onReceive
  - Resources are defined at graph level and referenced by ID in nodes
  - Edges can have labels/expressions (e.g., "D6" for dice rolls) that modify flow behavior
  - Gates can distribute resources deterministically (by weights) or probabilistically
  - Converters transform one resource type to another with a conversion rate
  - Traders exchange resources with explicit offer/request semantics

---

## Open Questions

- [Questions that need answers]

---

## Future Considerations

- [Ideas for future DSL versions]


  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**6. Gate (Ворота/Гейт)**
- **Purpose:** Controls and distributes resource flow between multiple paths. Can route resources probabilistically or deterministically.
- **Semantic Properties:**
  - `distributionMode` (enum): "deterministic" (fixed weights) or "probabilistic" (random based on weights)
  - `weights` (array of numbers): Weight coefficients for each output path (for weighted distribution)
  - `condition` (string, optional): Condition expression that must be true for gate to pass resources
  - `activationMode` (enum, optional): When the gate activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**7. RandomSplit (Случайное разделение)**
- **Purpose:** Splits incoming resources randomly across multiple output paths based on weights.
- **Semantic Properties:**
  - `weights` (array of numbers): Weight coefficients for each output path
  - `consumeInput` (boolean, optional): Whether input resource is consumed when splitting
  - `activationMode` (enum, optional): When the split activates (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**Activation Modes:**
- `automatic` / `automatically`: Node activates on every time step
- `interactive`: Node activates only when user interacts with it
- `onStart`: Node activates once at simulation start
- `onReceive`: Node activates when it receives resources

#### Edges/Connections

**1. Resource Connection (Ресурсная связь)**
- **Purpose:** Defines how resources flow between nodes. Moves resources from source node to target node.
- **Semantic Properties:**
  - `from` (nodeId): Source node ID
  - `to` (nodeId): Target node ID
  - `flowRate` (number, optional): Rate of resource flow (resources per time unit)
  - `batch` (number, optional): Batch size - how many resources move per transfer
  - `delayMs` (number, optional): Delay before resources arrive at target
  - `weight` (number, optional): Weight for probabilistic routing (when multiple edges from same node)
  - `label` (string, optional): Label/expression that determines flow behavior (e.g., "D6" for dice roll)
  - `condition` (string, optional): Condition expression - connection only active when condition is true
  - `outResourceId` (string, optional): Resource type transformation on edge (if different from source)
- **Visual Properties:**
  - `sourceHandle`, `targetHandle`: Which ports/handles are connected
  - `points`: Polyline bend points for edge geometry
  - `color`, `style`: Visual styling

**2. State Connection (Связь состояний)**
- **Purpose:** Changes state of nodes or edges based on conditions. Transmits state information rather than resources.
- **Semantic Properties:**
  - `from` (nodeId): Source node ID
  - `to` (nodeId): Target node ID or edge ID
  - `condition` (string): Condition expression that must be true for state change
  - `effect` (string): Effect description - what state change occurs (e.g., "activate", "setRate")
  - `targetProperty` (string, optional): Which property of target is modified
- **Visual Properties:**
  - `sourceHandle`, `targetHandle`: Which ports/handles are connected
  - `points`: Polyline bend points
  - `color`, `style`: Visual styling (typically different from resource connections)

**3. Trigger Connection (Триггерная связь)**
- **Purpose:** Activates a node when certain conditions are met. Used for event-driven activation.
- **Semantic Properties:**
  - `from` (nodeId): Source node ID
  - `to` (nodeId): Target node ID
  - `triggerCondition` (string): Condition expression that triggers activation
  - `effect` (string, optional): What happens when triggered (e.g., "activate", "deactivate")
- **Visual Properties:**
  - `sourceHandle`, `targetHandle`: Which ports/handles are connected
  - `points`: Polyline bend points
  - `color`, `style`: Visual styling

#### Resources

Resources are defined at the graph level in the `resources` array:
- `id` (string): Unique identifier for the resource type
- `label` (string): Human-readable name for the resource

Resources are referenced by `resourceId` in nodes and edges. Resources represent game elements such as currency, health points, experience, items, etc.

---

## Editable Properties

### Node Properties

All semantic properties described in the [Node Types](#nodes) section above are editable for each node type. See the detailed property lists for each node type (Pool, Source, Drain, Converter, Trader, Gate, RandomSplit) in the "Object Types & Semantics" section.

Visual properties (position, color, shape) are also editable but do not affect simulation.

### Edge Properties

All semantic properties described in the [Edge Types](#edgesconnections) section above are editable for each edge type. See the detailed property lists for each edge type (Resource Connection, State Connection, Trigger Connection) in the "Object Types & Semantics" section.

Visual properties (sourceHandle, targetHandle, points, color, style) are also editable but do not affect simulation.

### Graph-Level Properties

Editable at graph level:
- `meta.name` (string): Graph name
- `meta.seed` (number): Random seed for deterministic simulation
- `meta.timeUnit` (string, optional): Time unit description (e.g., "ms", "seconds")
- `meta.notes` (string, optional): User notes about the graph
- `resources[]`: Array of resource definitions (can add/remove/edit resource types)

---

## Connection Rules & Constraints

### Allowed Connections

**Resource Connections:**
- **Source** → **Pool**: Source generates resources into a pool
- **Source** → **Converter**: Source provides input to converter
- **Source** → **Drain**: Source can feed directly into drain (rare use case)
- **Pool** → **Pool**: Resources can flow between pools
- **Pool** → **Drain**: Pool resources are consumed by drain
- **Pool** → **Converter**: Pool provides input to converter
- **Pool** → **Trader**: Pool provides resources for trading
- **Pool** → **Gate**: Pool feeds into gate for distribution
- **Pool** → **RandomSplit**: Pool feeds into random splitter
- **Converter** → **Pool**: Converter output goes to pool
- **Converter** → **Drain**: Converter output can go to drain
- **Trader** → **Pool**: Trader output goes to pool
- **Gate** → **Pool**: Gate distributes to multiple pools
- **Gate** → **Drain**: Gate can route to drain
- **RandomSplit** → **Pool**: Split outputs go to pools
- **RandomSplit** → **Drain**: Split outputs can go to drain

**State Connections:**
- Can connect any node to any other node or edge
- Used to modify node/edge properties based on conditions
- Typically connects nodes that need to influence each other's state

**Trigger Connections:**
- Can connect any node to any other node
- Used for event-driven activation
- Source node's state triggers activation of target node

### Forbidden Connections

**Resource Connections:**
- **Drain** → **Any node**: Drains only consume, they cannot output resources
- **Source** → **Source**: Sources cannot connect to each other (no resource flow between sources)
- Self-loops on **Source** or **Drain** are typically invalid (but may be allowed for special cases)

**General Rules:**
- Connections must respect node port definitions (inputs vs outputs)
- A node with no input ports (like Source) cannot receive resource connections as input
- A node with no output ports cannot send resource connections as output
- Duplicate connections in the same direction between the same nodes are forbidden (see connection validation)

### Connection Semantics

**Resource Connection Semantics:**
- Resources flow from source node to target node
- Flow rate determines how many resources move per time unit
- Batch size determines how many resources move per transfer event
- Delay adds time before resources arrive at target
- Weight is used for probabilistic routing when multiple edges exist from same source
- Label/expression can modify flow behavior (e.g., dice roll "D6" generates 1-6 resources)
- Condition makes connection active only when condition is true
- `outResourceId` allows resource type transformation on the edge

**State Connection Semantics:**
- Does not transfer resources, only state information
- When condition is met, applies effect to target node/edge
- Can modify node properties (e.g., change activation mode, change rate)
- Can modify edge properties (e.g., enable/disable edge, change flow rate)

**Trigger Connection Semantics:**
- When trigger condition is met, activates target node
- Used for event-driven behavior
- Does not transfer resources

### Port/Handle Rules

- Each node defines input and output ports (handles)
- Resource connections must connect output port of source node to input port of target node
- State and trigger connections can connect any ports (semantics depend on connection type)
- Multiple edges can connect from the same output port (for distribution)
- Multiple edges can connect to the same input port (for aggregation)
- Ports are identified by handle IDs (e.g., "left-1", "right-1", "top-1", "bottom-1")
- Handle positions are visual/editor properties and do not affect simulation logic

---

## Notes from Reference Product

### 2025-01-XX - Machinations.io Node Types Research
- Based on research of Machinations.io documentation and game design tooling:
  - Core node types: Pool, Source, Drain, Converter, Trader, Gate
  - Additional node type: RandomSplit (for probabilistic routing)
  - Three connection types: Resource Connection, State Connection, Trigger Connection
  - Activation modes control when nodes activate: automatic, interactive, onStart, onReceive
  - Resources are defined at graph level and referenced by ID in nodes
  - Edges can have labels/expressions (e.g., "D6" for dice rolls) that modify flow behavior
  - Gates can distribute resources deterministically (by weights) or probabilistically
  - Converters transform one resource type to another with a conversion rate
  - Traders exchange resources with explicit offer/request semantics

---

## Open Questions

- [Questions that need answers]

---

## Future Considerations

- [Ideas for future DSL versions]

