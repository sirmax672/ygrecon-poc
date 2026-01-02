<!-- docs/dsl-examples.md -->

# DSL Examples

Comprehensive examples demonstrating DSL capabilities and patterns.

---

## Node Type Examples

### Pool (Хранилище)

**Purpose:** Demonstrates a resource storage node with initial value and capacity.

```json
{
  "id": "gold_pool",
  "type": "core.Pool",
  "params": {
    "resourceId": "gold",
    "initial": 100,
    "capacity": 1000
  }
}
```

**Notes:**
- `resourceId`: References a resource defined in the graph's `resources` array
- `initial`: Starting amount of resources (optional, defaults to 0)
- `capacity`: Maximum storage limit (optional, unlimited if not specified)

---

### Source (Источник)

**Purpose:** Demonstrates resource generation with interval-based production.

```json
{
  "id": "gold_mine",
  "type": "core.Source",
  "params": {
    "resourceId": "gold",
    "mode": "interval",
    "intervalMs": 1000,
    "amount": 10
  }
}
```

**Alternative: Instant mode source**

```json
{
  "id": "quest_reward",
  "type": "core.Source",
  "params": {
    "resourceId": "experience",
    "mode": "instant",
    "amount": 100
  }
}
```

**Notes:**
- `mode`: "interval" for periodic generation, "instant" for one-time generation
- `intervalMs`: Time between generations (for interval mode)
- `amount`: Resources generated per activation

---

### Drain (Сток)

**Purpose:** Demonstrates resource consumption/removal.

```json
{
  "id": "expense_drain",
  "type": "core.Drain",
  "params": {
    "resourceId": "gold",
    "consumptionRate": 5
  }
}
```

**Notes:**
- `consumptionRate`: Amount consumed per activation
- `resourceId`: Optional filter for resource type

---

### Converter (Преобразователь)

**Purpose:** Demonstrates resource type transformation.

```json
{
  "id": "gold_to_silver",
  "type": "core.Converter",
  "params": {
    "inputResourceId": "gold",
    "outputResourceId": "silver",
    "conversionRate": 2
  }
}
```

**Notes:**
- `conversionRate`: Output amount per input unit (e.g., 2 means 1 gold = 2 silver)
- Takes input from one resource type, produces output of another type

---

### Trader (Обменник)

**Purpose:** Demonstrates resource exchange with explicit offer/request.

```json
{
  "id": "wood_stone_trader",
  "type": "core.Trader",
  "params": {
    "offerResourceId": "wood",
    "offerAmount": 2,
    "requestResourceId": "stone",
    "requestAmount": 3
  }
}
```

**Notes:**
- `offerAmount`: How much of offer resource is required
- `requestAmount`: How much of request resource is provided
- Exchange ratio: 2 wood → 3 stone

---

### Gate (Ворота)

**Purpose:** Demonstrates deterministic resource distribution.

```json
{
  "id": "splitter_gate",
  "type": "core.Gate",
  "params": {
    "distributionMode": "deterministic",
    "weights": [0.7, 0.3]
  }
}
```

**Alternative: Probabilistic gate**

```json
{
  "id": "random_gate",
  "type": "core.Gate",
  "params": {
    "distributionMode": "probabilistic",
    "weights": [0.5, 0.3, 0.2]
  }
}
```

**Notes:**
- `distributionMode`: "deterministic" (fixed ratio) or "probabilistic" (random based on weights)
- `weights`: Array of weights for each output path (must match number of output edges)
- Weights are normalized automatically

---

### RandomSplit (Случайное разделение)

**Purpose:** Demonstrates probabilistic resource splitting.

```json
{
  "id": "loot_splitter",
  "type": "core.RandomSplit",
  "params": {
    "weights": [1, 1],
    "consumeInput": true
  }
}
```

**Notes:**
- `weights`: Weight coefficients for each output (e.g., [1, 1] = 50/50 split)
- `consumeInput`: Whether input resource is consumed when splitting
- Resources are randomly distributed based on weights

---

## Edge Type Examples

### Resource Connection (Ресурсная связь)

**Purpose:** Basic resource flow between nodes.

```json
{
  "id": "source_to_pool",
  "from": "gold_mine",
  "to": "gold_pool",
  "params": {
    "flowRate": 10,
    "batch": 1,
    "delayMs": 0
  }
}
```

**With weight for probabilistic routing:**

```json
{
  "id": "gate_to_pool1",
  "from": "splitter_gate",
  "to": "pool_1",
  "params": {
    "weight": 0.7,
    "batch": 1
  }
}
```

**With label/expression (dice roll):**

```json
{
  "id": "random_loot",
  "from": "loot_source",
  "to": "loot_pool",
  "params": {
    "label": "D6",
    "batch": 1
  }
}
```

**With resource transformation:**

```json
{
  "id": "convert_edge",
  "from": "input_pool",
  "to": "output_pool",
  "params": {
    "outResourceId": "silver",
    "batch": 1
  }
}
```

**Notes:**
- `flowRate`: Resources per time unit
- `batch`: Resources per transfer event
- `delayMs`: Delay before resources arrive
- `weight`: For weighted routing when multiple edges from same source
- `label`: Expression that modifies flow (e.g., "D6" = dice roll 1-6)
- `outResourceId`: Resource type transformation on edge

---

### State Connection (Связь состояний)

**Purpose:** Modifies node/edge state based on conditions.

```json
{
  "id": "activate_converter",
  "from": "control_pool",
  "to": "gold_to_silver",
  "params": {
    "condition": "control_pool.amount > 50",
    "effect": "activate",
    "targetProperty": "activationMode"
  }
}
```

**Notes:**
- `condition`: Expression that must be true for state change
- `effect`: What happens (e.g., "activate", "setRate")
- `targetProperty`: Which property is modified
- Does not transfer resources, only state information

---

### Trigger Connection (Триггерная связь)

**Purpose:** Event-driven node activation.

```json
{
  "id": "quest_trigger",
  "from": "quest_complete",
  "to": "reward_source",
  "params": {
    "triggerCondition": "quest_complete.completed == true",
    "effect": "activate"
  }
}
```

**Notes:**
- `triggerCondition`: Condition that triggers activation
- `effect`: What happens when triggered
- Used for event-driven behavior

---

## Complete Graph Examples

### Example 1: Simple Resource Generation and Storage

**Purpose:** Demonstrates basic Source → Pool → Drain flow.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Simple Gold Flow",
    "seed": 12345,
    "timeUnit": "ms"
  },
  "resources": [
    { "id": "gold", "label": "Gold" }
  ],
  "nodes": [
    {
      "id": "gold_source",
      "type": "core.Source",
      "params": {
        "resourceId": "gold",
        "mode": "interval",
        "intervalMs": 1000,
        "amount": 10
      }
    },
    {
      "id": "gold_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "gold",
        "initial": 0,
        "capacity": 1000
      }
    },
    {
      "id": "expense_drain",
      "type": "core.Drain",
      "params": {
        "resourceId": "gold",
        "consumptionRate": 5
      }
    }
  ],
  "edges": [
    {
      "id": "source_to_pool",
      "from": "gold_source",
      "to": "gold_pool",
      "params": {
        "batch": 10,
        "delayMs": 0
      }
    },
    {
      "id": "pool_to_drain",
      "from": "gold_pool",
      "to": "expense_drain",
      "params": {
        "batch": 5,
        "delayMs": 0
      }
    }
  ]
}
```

---

### Example 2: Resource Conversion

**Purpose:** Demonstrates Converter transforming one resource type to another.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Gold to Silver Conversion",
    "seed": 12345
  },
  "resources": [
    { "id": "gold", "label": "Gold" },
    { "id": "silver", "label": "Silver" }
  ],
  "nodes": [
    {
      "id": "gold_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "gold",
        "initial": 100
      }
    },
    {
      "id": "converter",
      "type": "core.Converter",
      "params": {
        "inputResourceId": "gold",
        "outputResourceId": "silver",
        "conversionRate": 2
      }
    },
    {
      "id": "silver_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "silver",
        "initial": 0
      }
    }
  ],
  "edges": [
    {
      "id": "gold_to_converter",
      "from": "gold_pool",
      "to": "converter",
      "params": {
        "batch": 1
      }
    },
    {
      "id": "converter_to_silver",
      "from": "converter",
      "to": "silver_pool",
      "params": {
        "batch": 2
      }
    }
  ]
}
```

---

### Example 3: Probabilistic Distribution with Gate

**Purpose:** Demonstrates Gate distributing resources probabilistically.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Random Loot Distribution",
    "seed": 12345
  },
  "resources": [
    { "id": "loot", "label": "Loot" }
  ],
  "nodes": [
    {
      "id": "loot_source",
      "type": "core.Source",
      "params": {
        "resourceId": "loot",
        "mode": "interval",
        "intervalMs": 2000,
        "amount": 1
      }
    },
    {
      "id": "distribution_gate",
      "type": "core.Gate",
      "params": {
        "distributionMode": "probabilistic",
        "weights": [0.5, 0.3, 0.2]
      }
    },
    {
      "id": "common_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "loot",
        "initial": 0
      }
    },
    {
      "id": "rare_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "loot",
        "initial": 0
      }
    },
    {
      "id": "epic_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "loot",
        "initial": 0
      }
    }
  ],
  "edges": [
    {
      "id": "source_to_gate",
      "from": "loot_source",
      "to": "distribution_gate",
      "params": {
        "batch": 1
      }
    },
    {
      "id": "gate_to_common",
      "from": "distribution_gate",
      "to": "common_pool",
      "params": {
        "weight": 0.5,
        "batch": 1
      }
    },
    {
      "id": "gate_to_rare",
      "from": "distribution_gate",
      "to": "rare_pool",
      "params": {
        "weight": 0.3,
        "batch": 1
      }
    },
    {
      "id": "gate_to_epic",
      "from": "distribution_gate",
      "to": "epic_pool",
      "params": {
        "weight": 0.2,
        "batch": 1
      }
    }
  ]
}
```

---

## Common Patterns

### Pattern 1: Feedback Loop

**Use case:** Resources flow in a cycle, creating a feedback mechanism.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Feedback Loop Example",
    "seed": 12345
  },
  "resources": [
    { "id": "currency", "label": "Currency" }
  ],
  "nodes": [
    {
      "id": "source",
      "type": "core.Source",
      "params": {
        "resourceId": "currency",
        "mode": "interval",
        "intervalMs": 1000,
        "amount": 10
      }
    },
    {
      "id": "pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "currency",
        "initial": 0
      }
    },
    {
      "id": "converter",
      "type": "core.Converter",
      "params": {
        "inputResourceId": "currency",
        "outputResourceId": "currency",
        "conversionRate": 1.1
      }
    }
  ],
  "edges": [
    {
      "id": "source_to_pool",
      "from": "source",
      "to": "pool",
      "params": { "batch": 10 }
    },
    {
      "id": "pool_to_converter",
      "from": "pool",
      "to": "converter",
      "params": { "batch": 1 }
    },
    {
      "id": "converter_to_pool",
      "from": "converter",
      "to": "pool",
      "params": { "batch": 1 }
    }
  ]
}
```

---

## Edge Cases & Complex Scenarios

### Scenario: Multiple Resource Types with Conversion Chain

**Description:** Demonstrates a chain of converters transforming resources through multiple types.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Resource Conversion Chain",
    "seed": 12345
  },
  "resources": [
    { "id": "wood", "label": "Wood" },
    { "id": "planks", "label": "Planks" },
    { "id": "furniture", "label": "Furniture" }
  ],
  "nodes": [
    {
      "id": "wood_source",
      "type": "core.Source",
      "params": {
        "resourceId": "wood",
        "mode": "interval",
        "intervalMs": 1000,
        "amount": 5
      }
    },
    {
      "id": "wood_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "wood",
        "initial": 0
      }
    },
    {
      "id": "wood_to_planks",
      "type": "core.Converter",
      "params": {
        "inputResourceId": "wood",
        "outputResourceId": "planks",
        "conversionRate": 2
      }
    },
    {
      "id": "planks_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "planks",
        "initial": 0
      }
    },
    {
      "id": "planks_to_furniture",
      "type": "core.Converter",
      "params": {
        "inputResourceId": "planks",
        "outputResourceId": "furniture",
        "conversionRate": 1
      }
    },
    {
      "id": "furniture_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "furniture",
        "initial": 0
      }
    }
  ],
  "edges": [
    {
      "id": "source_to_wood",
      "from": "wood_source",
      "to": "wood_pool",
      "params": { "batch": 5 }
    },
    {
      "id": "wood_to_converter",
      "from": "wood_pool",
      "to": "wood_to_planks",
      "params": { "batch": 1 }
    },
    {
      "id": "converter_to_planks",
      "from": "wood_to_planks",
      "to": "planks_pool",
      "params": { "batch": 2 }
    },
    {
      "id": "planks_to_converter",
      "from": "planks_pool",
      "to": "planks_to_furniture",
      "params": { "batch": 1 }
    },
    {
      "id": "converter_to_furniture",
      "from": "planks_to_furniture",
      "to": "furniture_pool",
      "params": { "batch": 1 }
    }
  ]
}
```

**Notes:**
- Resources flow through multiple conversion stages
- Each converter transforms one resource type to the next
- Conversion rates determine output amounts


# DSL Examples

Comprehensive examples demonstrating DSL capabilities and patterns.

---

## Node Type Examples

### Pool (Хранилище)

**Purpose:** Demonstrates a resource storage node with initial value and capacity.

```json
{
  "id": "gold_pool",
  "type": "core.Pool",
  "params": {
    "resourceId": "gold",
    "initial": 100,
    "capacity": 1000
  }
}
```

**Notes:**
- `resourceId`: References a resource defined in the graph's `resources` array
- `initial`: Starting amount of resources (optional, defaults to 0)
- `capacity`: Maximum storage limit (optional, unlimited if not specified)

---

### Source (Источник)

**Purpose:** Demonstrates resource generation with interval-based production.

```json
{
  "id": "gold_mine",
  "type": "core.Source",
  "params": {
    "resourceId": "gold",
    "mode": "interval",
    "intervalMs": 1000,
    "amount": 10
  }
}
```

**Alternative: Instant mode source**

```json
{
  "id": "quest_reward",
  "type": "core.Source",
  "params": {
    "resourceId": "experience",
    "mode": "instant",
    "amount": 100
  }
}
```

**Notes:**
- `mode`: "interval" for periodic generation, "instant" for one-time generation
- `intervalMs`: Time between generations (for interval mode)
- `amount`: Resources generated per activation

---

### Drain (Сток)

**Purpose:** Demonstrates resource consumption/removal.

```json
{
  "id": "expense_drain",
  "type": "core.Drain",
  "params": {
    "resourceId": "gold",
    "consumptionRate": 5
  }
}
```

**Notes:**
- `consumptionRate`: Amount consumed per activation
- `resourceId`: Optional filter for resource type

---

### Converter (Преобразователь)

**Purpose:** Demonstrates resource type transformation.

```json
{
  "id": "gold_to_silver",
  "type": "core.Converter",
  "params": {
    "inputResourceId": "gold",
    "outputResourceId": "silver",
    "conversionRate": 2
  }
}
```

**Notes:**
- `conversionRate`: Output amount per input unit (e.g., 2 means 1 gold = 2 silver)
- Takes input from one resource type, produces output of another type

---

### Trader (Обменник)

**Purpose:** Demonstrates resource exchange with explicit offer/request.

```json
{
  "id": "wood_stone_trader",
  "type": "core.Trader",
  "params": {
    "offerResourceId": "wood",
    "offerAmount": 2,
    "requestResourceId": "stone",
    "requestAmount": 3
  }
}
```

**Notes:**
- `offerAmount`: How much of offer resource is required
- `requestAmount`: How much of request resource is provided
- Exchange ratio: 2 wood → 3 stone

---

### Gate (Ворота)

**Purpose:** Demonstrates deterministic resource distribution.

```json
{
  "id": "splitter_gate",
  "type": "core.Gate",
  "params": {
    "distributionMode": "deterministic",
    "weights": [0.7, 0.3]
  }
}
```

**Alternative: Probabilistic gate**

```json
{
  "id": "random_gate",
  "type": "core.Gate",
  "params": {
    "distributionMode": "probabilistic",
    "weights": [0.5, 0.3, 0.2]
  }
}
```

**Notes:**
- `distributionMode`: "deterministic" (fixed ratio) or "probabilistic" (random based on weights)
- `weights`: Array of weights for each output path (must match number of output edges)
- Weights are normalized automatically

---

### RandomSplit (Случайное разделение)

**Purpose:** Demonstrates probabilistic resource splitting.

```json
{
  "id": "loot_splitter",
  "type": "core.RandomSplit",
  "params": {
    "weights": [1, 1],
    "consumeInput": true
  }
}
```

**Notes:**
- `weights`: Weight coefficients for each output (e.g., [1, 1] = 50/50 split)
- `consumeInput`: Whether input resource is consumed when splitting
- Resources are randomly distributed based on weights

---

## Edge Type Examples

### Resource Connection (Ресурсная связь)

**Purpose:** Basic resource flow between nodes.

```json
{
  "id": "source_to_pool",
  "from": "gold_mine",
  "to": "gold_pool",
  "params": {
    "flowRate": 10,
    "batch": 1,
    "delayMs": 0
  }
}
```

**With weight for probabilistic routing:**

```json
{
  "id": "gate_to_pool1",
  "from": "splitter_gate",
  "to": "pool_1",
  "params": {
    "weight": 0.7,
    "batch": 1
  }
}
```

**With label/expression (dice roll):**

```json
{
  "id": "random_loot",
  "from": "loot_source",
  "to": "loot_pool",
  "params": {
    "label": "D6",
    "batch": 1
  }
}
```

**With resource transformation:**

```json
{
  "id": "convert_edge",
  "from": "input_pool",
  "to": "output_pool",
  "params": {
    "outResourceId": "silver",
    "batch": 1
  }
}
```

**Notes:**
- `flowRate`: Resources per time unit
- `batch`: Resources per transfer event
- `delayMs`: Delay before resources arrive
- `weight`: For weighted routing when multiple edges from same source
- `label`: Expression that modifies flow (e.g., "D6" = dice roll 1-6)
- `outResourceId`: Resource type transformation on edge

---

### State Connection (Связь состояний)

**Purpose:** Modifies node/edge state based on conditions.

```json
{
  "id": "activate_converter",
  "from": "control_pool",
  "to": "gold_to_silver",
  "params": {
    "condition": "control_pool.amount > 50",
    "effect": "activate",
    "targetProperty": "activationMode"
  }
}
```

**Notes:**
- `condition`: Expression that must be true for state change
- `effect`: What happens (e.g., "activate", "setRate")
- `targetProperty`: Which property is modified
- Does not transfer resources, only state information

---

### Trigger Connection (Триггерная связь)

**Purpose:** Event-driven node activation.

```json
{
  "id": "quest_trigger",
  "from": "quest_complete",
  "to": "reward_source",
  "params": {
    "triggerCondition": "quest_complete.completed == true",
    "effect": "activate"
  }
}
```

**Notes:**
- `triggerCondition`: Condition that triggers activation
- `effect`: What happens when triggered
- Used for event-driven behavior

---

## Complete Graph Examples

### Example 1: Simple Resource Generation and Storage

**Purpose:** Demonstrates basic Source → Pool → Drain flow.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Simple Gold Flow",
    "seed": 12345,
    "timeUnit": "ms"
  },
  "resources": [
    { "id": "gold", "label": "Gold" }
  ],
  "nodes": [
    {
      "id": "gold_source",
      "type": "core.Source",
      "params": {
        "resourceId": "gold",
        "mode": "interval",
        "intervalMs": 1000,
        "amount": 10
      }
    },
    {
      "id": "gold_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "gold",
        "initial": 0,
        "capacity": 1000
      }
    },
    {
      "id": "expense_drain",
      "type": "core.Drain",
      "params": {
        "resourceId": "gold",
        "consumptionRate": 5
      }
    }
  ],
  "edges": [
    {
      "id": "source_to_pool",
      "from": "gold_source",
      "to": "gold_pool",
      "params": {
        "batch": 10,
        "delayMs": 0
      }
    },
    {
      "id": "pool_to_drain",
      "from": "gold_pool",
      "to": "expense_drain",
      "params": {
        "batch": 5,
        "delayMs": 0
      }
    }
  ]
}
```

---

### Example 2: Resource Conversion

**Purpose:** Demonstrates Converter transforming one resource type to another.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Gold to Silver Conversion",
    "seed": 12345
  },
  "resources": [
    { "id": "gold", "label": "Gold" },
    { "id": "silver", "label": "Silver" }
  ],
  "nodes": [
    {
      "id": "gold_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "gold",
        "initial": 100
      }
    },
    {
      "id": "converter",
      "type": "core.Converter",
      "params": {
        "inputResourceId": "gold",
        "outputResourceId": "silver",
        "conversionRate": 2
      }
    },
    {
      "id": "silver_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "silver",
        "initial": 0
      }
    }
  ],
  "edges": [
    {
      "id": "gold_to_converter",
      "from": "gold_pool",
      "to": "converter",
      "params": {
        "batch": 1
      }
    },
    {
      "id": "converter_to_silver",
      "from": "converter",
      "to": "silver_pool",
      "params": {
        "batch": 2
      }
    }
  ]
}
```

---

### Example 3: Probabilistic Distribution with Gate

**Purpose:** Demonstrates Gate distributing resources probabilistically.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Random Loot Distribution",
    "seed": 12345
  },
  "resources": [
    { "id": "loot", "label": "Loot" }
  ],
  "nodes": [
    {
      "id": "loot_source",
      "type": "core.Source",
      "params": {
        "resourceId": "loot",
        "mode": "interval",
        "intervalMs": 2000,
        "amount": 1
      }
    },
    {
      "id": "distribution_gate",
      "type": "core.Gate",
      "params": {
        "distributionMode": "probabilistic",
        "weights": [0.5, 0.3, 0.2]
      }
    },
    {
      "id": "common_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "loot",
        "initial": 0
      }
    },
    {
      "id": "rare_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "loot",
        "initial": 0
      }
    },
    {
      "id": "epic_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "loot",
        "initial": 0
      }
    }
  ],
  "edges": [
    {
      "id": "source_to_gate",
      "from": "loot_source",
      "to": "distribution_gate",
      "params": {
        "batch": 1
      }
    },
    {
      "id": "gate_to_common",
      "from": "distribution_gate",
      "to": "common_pool",
      "params": {
        "weight": 0.5,
        "batch": 1
      }
    },
    {
      "id": "gate_to_rare",
      "from": "distribution_gate",
      "to": "rare_pool",
      "params": {
        "weight": 0.3,
        "batch": 1
      }
    },
    {
      "id": "gate_to_epic",
      "from": "distribution_gate",
      "to": "epic_pool",
      "params": {
        "weight": 0.2,
        "batch": 1
      }
    }
  ]
}
```

---

## Common Patterns

### Pattern 1: Feedback Loop

**Use case:** Resources flow in a cycle, creating a feedback mechanism.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Feedback Loop Example",
    "seed": 12345
  },
  "resources": [
    { "id": "currency", "label": "Currency" }
  ],
  "nodes": [
    {
      "id": "source",
      "type": "core.Source",
      "params": {
        "resourceId": "currency",
        "mode": "interval",
        "intervalMs": 1000,
        "amount": 10
      }
    },
    {
      "id": "pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "currency",
        "initial": 0
      }
    },
    {
      "id": "converter",
      "type": "core.Converter",
      "params": {
        "inputResourceId": "currency",
        "outputResourceId": "currency",
        "conversionRate": 1.1
      }
    }
  ],
  "edges": [
    {
      "id": "source_to_pool",
      "from": "source",
      "to": "pool",
      "params": { "batch": 10 }
    },
    {
      "id": "pool_to_converter",
      "from": "pool",
      "to": "converter",
      "params": { "batch": 1 }
    },
    {
      "id": "converter_to_pool",
      "from": "converter",
      "to": "pool",
      "params": { "batch": 1 }
    }
  ]
}
```

---

## Edge Cases & Complex Scenarios

### Scenario: Multiple Resource Types with Conversion Chain

**Description:** Demonstrates a chain of converters transforming resources through multiple types.

```json
{
  "dslVersion": "0.2",
  "meta": {
    "name": "Resource Conversion Chain",
    "seed": 12345
  },
  "resources": [
    { "id": "wood", "label": "Wood" },
    { "id": "planks", "label": "Planks" },
    { "id": "furniture", "label": "Furniture" }
  ],
  "nodes": [
    {
      "id": "wood_source",
      "type": "core.Source",
      "params": {
        "resourceId": "wood",
        "mode": "interval",
        "intervalMs": 1000,
        "amount": 5
      }
    },
    {
      "id": "wood_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "wood",
        "initial": 0
      }
    },
    {
      "id": "wood_to_planks",
      "type": "core.Converter",
      "params": {
        "inputResourceId": "wood",
        "outputResourceId": "planks",
        "conversionRate": 2
      }
    },
    {
      "id": "planks_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "planks",
        "initial": 0
      }
    },
    {
      "id": "planks_to_furniture",
      "type": "core.Converter",
      "params": {
        "inputResourceId": "planks",
        "outputResourceId": "furniture",
        "conversionRate": 1
      }
    },
    {
      "id": "furniture_pool",
      "type": "core.Pool",
      "params": {
        "resourceId": "furniture",
        "initial": 0
      }
    }
  ],
  "edges": [
    {
      "id": "source_to_wood",
      "from": "wood_source",
      "to": "wood_pool",
      "params": { "batch": 5 }
    },
    {
      "id": "wood_to_converter",
      "from": "wood_pool",
      "to": "wood_to_planks",
      "params": { "batch": 1 }
    },
    {
      "id": "converter_to_planks",
      "from": "wood_to_planks",
      "to": "planks_pool",
      "params": { "batch": 2 }
    },
    {
      "id": "planks_to_converter",
      "from": "planks_pool",
      "to": "planks_to_furniture",
      "params": { "batch": 1 }
    },
    {
      "id": "converter_to_furniture",
      "from": "planks_to_furniture",
      "to": "furniture_pool",
      "params": { "batch": 1 }
    }
  ]
}
```

**Notes:**
- Resources flow through multiple conversion stages
- Each converter transforms one resource type to the next
- Conversion rates determine output amounts

