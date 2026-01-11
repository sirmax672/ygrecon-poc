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
  - `initial` (number, optional): Initial amount of resources in the pool (default: 0, maps to Machinations "Capacity (display)" when >= 0)
  - `capacity` (number, optional): Maximum capacity of the pool (-1 = unlimited, default: -1/unlimited, maps to Machinations "Capacity (limit)")
  - `activation` (enum, optional): Activation type - "automatic", "passive", "interactive" (default: "passive", maps to Machinations "Activation")
  - `activationMode` (enum, optional): Flow mode - "push-all", "pull-any", "push-any" (default: "pull-any", maps to Machinations "Activation Mode", see Activation Modes below)
  - `overflow` (enum, optional): Behavior when capacity exceeded - "block" (reject new resources) or "allow" (accept anyway, default: "block", maps to Machinations "Overflow")
  - `showInChart` (boolean, optional): Whether to show this pool's value in simulation chart (default: false, maps to Machinations "Show in chart")
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling (does not affect simulation)
  - `resourceColor` (string, optional): Color for resource visualization (maps to Machinations "Resources (color)")

**2. Source (Источник)**
- **Purpose:** Generates and creates resources in the system. Produces resources at a specified rate or on demand.
- **Semantic Properties:**
  - `resourceId` (string): Type of resource generated
  - `mode` (enum, optional): Generation mode - "interval" (periodic) or "instant" (one-time, default: "interval")
  - `intervalMs` (number, optional): Time interval between generations in milliseconds (for interval mode)
  - `amount` (number, optional): Amount of resources generated per activation (default: 1)
  - `productionRate` (number, optional): Alternative to amount/interval - resources per time unit
  - `activation` (enum, optional): Activation type - "automatic", "passive", "interactive" (default: "automatic")
  - `activationMode` (enum, optional): Flow mode - "push-any", "push-all" (default: "push-any", see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling
  - `resourceColor` (string, optional): Color for resource visualization

**3. Drain (Сток/Слив)**
- **Purpose:** Consumes and removes resources from the system. Destroys resources that flow into it.
- **Semantic Properties:**
  - `resourceId` (string, optional): Type of resource consumed (if filtering is needed)
  - `consumptionRate` (number, optional): Amount of resources consumed per activation (default: 1)
  - `activation` (enum, optional): Activation type - "automatic", "passive", "interactive" (default: "passive")
  - `activationMode` (enum, optional): Flow mode - "pull-any" (default, see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**4. Converter (Преобразователь/Конвертер)**
- **Purpose:** Transforms one type of resource into another type. Takes input resources and produces output resources.
- **Semantic Properties:**
  - `inputResourceId` (string): Type of resource accepted as input
  - `outputResourceId` (string): Type of resource produced as output
  - `conversionRate` (number): Conversion ratio (e.g., 2 means 1 input = 2 output)
  - `conversion` (enum, optional): Conversion mode - "single" (one unit at a time, default) or "batch"
  - `activation` (enum, optional): Activation type - "automatic", "passive", "interactive" (default: "passive")
  - `activationMode` (enum, optional): Flow mode - "pull-any" (default, see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling
  - `resourceColor` (string, optional): Color for input resource visualization

**5. Trader (Обменник)**
- **Purpose:** Exchanges resources of one type for resources of another type. Similar to converter but with explicit offer/request semantics.
- **Semantic Properties:**
  - `offerResourceId` (string): Type of resource offered
  - `offerAmount` (number): Amount of offered resources required
  - `requestResourceId` (string): Type of resource requested
  - `requestAmount` (number): Amount of requested resources provided
  - `trade` (enum, optional): Trade mode - "single" (one trade at a time, default) or "batch"
  - `activation` (enum, optional): Activation type - "automatic", "passive", "interactive" (default: "passive")
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**6. Gate (Ворота/Гейт)**
- **Purpose:** Controls and distributes resource flow between multiple paths. Can route resources probabilistically or deterministically.
- **Semantic Properties:**
  - `distribution` (enum): Distribution type - "dice" (probabilistic/random) or "deterministic" (fixed weights)
  - `distributionMode` (enum, optional): Alias for `distribution` - "probabilistic" (same as "dice") or "deterministic"
  - `weights` (array of numbers, optional): Weight coefficients for each output path (must match number of output edges)
  - `condition` (string, optional): Condition expression that must be true for gate to pass resources
  - `activation` (enum, optional): Activation type - "automatic", "passive", "interactive" (default: "passive")
  - `activationMode` (enum, optional): Flow mode - "pull-any", "push-all" (default: "pull-any", see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**7. RandomSplit (Случайное разделение)**
- **Purpose:** Splits incoming resources randomly across multiple output paths based on weights.
- **Semantic Properties:**
  - `weights` (array of numbers): Weight coefficients for each output path
  - `consumeInput` (boolean, optional): Whether input resource is consumed when splitting (default: true)
  - `activation` (enum, optional): Activation type - "automatic", "passive", "interactive" (default: "passive")
  - `activationMode` (enum, optional): Flow mode (see Activation Modes below)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**8. Register (Регистр)**
- **Purpose:** Stores and manages a numeric value that can be modified by formulas or connections. Used for counters, variables, and state tracking.
- **Semantic Properties:**
  - `formula` (string, optional): Formula expression that computes the register value
  - `interactive` (boolean, optional): Whether the register value can be modified by user interaction (default: false)
  - `initial` (number, optional): Initial value of the register (default: 0)
  - `step` (number, optional): Step size for value changes (default: 1)
  - `min` (number, optional): Minimum allowed value
  - `max` (number, optional): Maximum allowed value
  - `showInChart` (boolean, optional): Whether to show this register's value in simulation chart (default: false)
  - `forceUpdateEachStep` (boolean, optional): Whether to recompute formula value on every simulation step (default: false)
- **Visual Properties:**
  - `position`: Node position in editor
  - `color`, `shape`: Visual styling

**Activation Modes:**
- `activation` (enum): Activation type - "automatic" (activates every step), "passive" (activated by connections), "interactive" (user interaction)
- `activationMode` (enum): Flow mode - "push-any" (push to any output, for Sources), "push-all" (push to all outputs, for Pools/Gates), "pull-any" (pull from any input, for Drains/Gates/Converters/Pools)

#### Edges/Connections

**1. Resource Connection (Ресурсная связь)**
- **Purpose:** Defines how resources flow between nodes. Moves resources from source node to target node.
- **Semantic Properties:**
  - `from` (nodeId): Source node ID
  - `to` (nodeId): Target node ID
  - **Formula structure:**
    - `formulaType` (enum, optional): Formula type - "number" (fixed value), "chance" (probability-based), "dice" (dice roll), "all" (all resources), "weights" (weighted distribution)
    - `formulaSubtype` (string, optional): Formula subtype for complex formulas
    - `formulaParam1` (number, optional): First formula parameter (e.g., probability % for "chance", dice sides for "dice", batch amount for "number")
    - `formulaParam2` (number, optional): Second formula parameter
  - **Simplified properties (for compatibility):**
    - `batch` (number, optional): Batch size - how many resources move per transfer (maps to formulaType="number", formulaParam1=batch)
    - `weight` (number, optional): Weight for probabilistic routing (maps to formulaType="weights" or "chance")
    - `label` (string, optional): Label/expression (e.g., "D6" for dice roll, maps to formulaType="dice", formulaParam1=6)
    - `condition` (string, optional): Condition expression - connection only active when condition is true
  - `interval` (number, optional): Interval for resource transfer
  - `transfer` (enum, optional): Transfer mode - "interval-based" (default), "pull-any", "push-any"
  - `outResourceId` (string, optional): Resource type transformation on edge (if different from source)
  - `colorCoding` (boolean, optional): Whether to use color coding for resource visualization (default: false)
  - `colorCodingColor` (string, optional): Color for resource visualization when colorCoding is true
  - `shuffleSource` (boolean, optional): Whether to shuffle the source before drawing resources (default: false)
  - `limitsMin` (number, optional): Minimum value limit
  - `limitsMax` (number, optional): Maximum value limit
- **Visual Properties:**
  - `sourceHandle`, `targetHandle`: Which ports/handles are connected
  - `points`: Polyline bend points for edge geometry
  - `color`, `style`: Visual styling

**2. State Connection (Связь состояний)**
- **Purpose:** Changes state of nodes or edges based on conditions. Transmits state information rather than resources. Includes both **Modifier Connections** (modify values) and **Logic Connections** (conditional logic).
- **Semantic Properties:**
  - `from` (nodeId): Source node ID
  - `to` (nodeId): Target node ID or edge ID
  - **Formula structure:**
    - `formulaType` (enum): Formula type - "modify-value" (modifies a value) or "condition" (conditional logic)
    - `formulaSubtype` (string, optional): Formula subtype - "add-change" (for modify-value), "equal", "greater-than", "less-than" (for condition)
    - `formulaParam1` (number, optional): First formula parameter (e.g., change amount for "modify-value", comparison value for "condition")
    - `formulaParam2` (number, optional): Second formula parameter
  - **Simplified properties (for compatibility):**
    - `condition` (string, optional): Condition expression that must be true for state change (maps to formulaType="condition")
    - `effect` (string, optional): Effect description - what state change occurs (e.g., "activate", "setRate", maps to formulaSubtype="add-change" when formulaType="modify-value")
    - `targetProperty` (string, optional): Which property of target is modified
  - `triggerOn` (string, optional): When the connection triggers (e.g., "on-change", "on-activate")
  - `colorCoding` (boolean, optional): Whether to use color coding for visualization (default: false)
  - `colorCodingColor` (string, optional): Color for visualization when colorCoding is true
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
- `label` (string): Human-readable display name for the resource
- `description` (string, optional): Description of the resource
- `default` (boolean, optional): Whether this resource is used as default (default: false)
- `active` (boolean, optional): Whether the resource is active (default: true)
- `content` (string, optional): SVG icon/content for the resource

Resources are referenced by `resourceId` in nodes and edges. Resources represent game elements such as currency, health points, experience, items, etc.

---

## Editable Properties

### Node Properties

All semantic properties described in the [Node Types](#nodes) section above are editable for each node type. See the detailed property lists for each node type (Pool, Source, Drain, Converter, Trader, Gate, RandomSplit, Register) in the "Object Types & Semantics" section.

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
- Formula structure (`formulaType`, `formulaSubtype`, `formulaParam1`, `formulaParam2`) defines how resources flow:
  - `formulaType="number"`: Fixed number of resources (formulaParam1 = batch size)
  - `formulaType="chance"`: Probability-based flow (formulaParam1 = probability %)
  - `formulaType="dice"`: Dice roll (formulaParam1 = dice sides, e.g., 6 for D6)
  - `formulaType="all"`: All resources flow
  - `formulaType="weights"`: Weighted distribution (formulaParam1 = weight)
- Simplified properties (`batch`, `weight`, `label`) map to Formula structure for backward compatibility
- Transfer mode (`transfer`) controls flow timing - "interval-based" (default), "pull-any", "push-any"
- Color coding (`colorCoding`, `colorCodingColor`) provides visual resource type indication
- Shuffle source (`shuffleSource`) randomizes resource drawing order
- Limits (`limitsMin`, `limitsMax`) constrain resource flow amounts
- `outResourceId` allows resource type transformation on the edge

**State Connection Semantics:**
- Does not transfer resources, only state information
- Formula structure (`formulaType`, `formulaSubtype`, `formulaParam1`, `formulaParam2`) defines state change behavior:
  - `formulaType="modify-value"`: Modifies a value (formulaSubtype="add-change", formulaParam1 = change amount)
  - `formulaType="condition"`: Conditional logic (formulaSubtype="equal", "greater-than", "less-than", formulaParam1 = comparison value)
- Simplified properties (`condition`, `effect`, `targetProperty`) map to Formula structure for backward compatibility
- Trigger on (`triggerOn`) specifies when the connection activates (e.g., "on-change", "on-activate")
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

### 2025-01-XX - Machinations.io Compatibility
- Structure aligned with Machinations.io v2.1 CSV export format:
  - **Node types:** Pool, Source, Drain, Converter, Trader, Gate, RandomSplit, Register
  - **Connection types:** Resource Connection (with Formula Type/Subtype/Params), State Connection (includes Modifier and Logic), Trigger Connection (legacy)
  - **Activation:** Two-level system - `activation` (automatic/passive/interactive) and `activationMode` (push-any/push-all/pull-any)
  - **Resources:** Extended with description, default, active, content (SVG) fields
  - **Formula structure:** Resource and State connections use Formula Type/Subtype/Param structure with simplified properties for compatibility
  - **Additional fields:** overflow, showInChart, colorCoding, shuffleSource, limits, and other Machinations-compatible properties added

---

## Open Questions

- [Questions that need answers]

---

## Future Considerations

- [Ideas for future DSL versions]
