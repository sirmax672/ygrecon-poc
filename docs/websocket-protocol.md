<!-- docs/websocket-protocol.md -->

# WebSocket Protocol Specification

This document defines the client-server communication protocol for the YgrEcon graph editor and simulation backend.

## Session Model

- **One WebSocket connection = One session**
- **One session = One graph** (1:1 relationship)
- Backend maintains graph state in memory per session
- Session is created automatically on WebSocket connect
- Session is destroyed on WebSocket disconnect
- Graph state is lost on disconnect (future: add persistence)

## Message Format

All messages are JSON objects with the following structure:

```typescript
{
  type: string,      // Message type (see below)
  payload: object    // Message-specific payload
}
```

## Frontend → Backend Messages

### `create_node`

Create a new node in the graph.

**Request:**
```json
{
  "type": "create_node",
  "payload": {
    "node_id": "source_1",
    "node_type": "core.Source",
    "params": {
      "ratePerSec": 10
    },
    "position": {
      "x": 100,
      "y": 200
    }
  }
}
```

**Response:**
```json
{
  "type": "node_created",
  "payload": {
    "node_id": "source_1",
    "valid": true
  }
}
```

Or on validation error:
```json
{
  "type": "node_created",
  "payload": {
    "node_id": "source_1",
    "valid": false,
    "issues": [
      {
        "code": "DUPLICATE_NODE_ID",
        "message": "Node with ID source_1 already exists",
        "node_id": "source_1"
      }
    ]
  }
}
```

### `update_node`

Update node parameters or position.

**Request:**
```json
{
  "type": "update_node",
  "payload": {
    "node_id": "source_1",
    "params": {
      "ratePerSec": 20
    },
    "position": {
      "x": 150,
      "y": 250
    }
  }
}
```

**Response:**
```json
{
  "type": "node_updated",
  "payload": {
    "node_id": "source_1",
    "valid": true
  }
}
```

### `delete_node`

Delete a node from the graph. All connected edges are automatically deleted.

**Request:**
```json
{
  "type": "delete_node",
  "payload": {
    "node_id": "source_1"
  }
}
```

**Response:**
```json
{
  "type": "node_deleted",
  "payload": {
    "node_id": "source_1"
  }
}
```

### `create_edge`

Create a new edge in the graph. Backend validates the connection before creating.

**Request:**
```json
{
  "type": "create_edge",
  "payload": {
    "edge_id": "edge_1",
    "from_node_id": "source_1",
    "to_node_id": "pool_1",
    "source_handle": "bottom-1",
    "target_handle": "top-1",
    "params": {}
  }
}
```

**Response:**
```json
{
  "type": "edge_created",
  "payload": {
    "edge_id": "edge_1",
    "valid": true
  }
}
```

Or on validation error:
```json
{
  "type": "edge_created",
  "payload": {
    "edge_id": "edge_1",
    "valid": false,
    "issues": [
      {
        "code": "INVALID_CONNECTION",
        "message": "Source nodes cannot have incoming edges",
        "node_id": "source_1",
        "edge_id": "edge_1"
      }
    ]
  }
}
```

### `update_edge`

Update edge parameters (e.g., visualization points).

**Request:**
```json
{
  "type": "update_edge",
  "payload": {
    "edge_id": "edge_1",
    "params": {
      "points": [
        { "x": 100, "y": 150 },
        { "x": 200, "y": 150 }
      ]
    }
  }
}
```

**Response:**
```json
{
  "type": "edge_updated",
  "payload": {
    "edge_id": "edge_1",
    "valid": true
  }
}
```

### `delete_edge`

Delete an edge from the graph.

**Request:**
```json
{
  "type": "delete_edge",
  "payload": {
    "edge_id": "edge_1"
  }
}
```

**Response:**
```json
{
  "type": "edge_deleted",
  "payload": {
    "edge_id": "edge_1"
  }
}
```

### `validate_connection`

Validate if an edge can be created (for real-time feedback during edge dragging). Does NOT modify the graph.

**Request:**
```json
{
  "type": "validate_connection",
  "payload": {
    "from_node_id": "source_1",
    "to_node_id": "pool_1",
    "source_handle": "bottom-1",
    "target_handle": "top-1",
    "edge_id": "temp-validation",
    "mode": "preliminary"
  }
}
```

**Response:**
```json
{
  "type": "validation_result",
  "payload": {
    "valid": true,
    "issues": []
  }
}
```

Or on validation error:
```json
{
  "type": "validation_result",
  "payload": {
    "valid": false,
    "issues": [
      {
        "code": "INVALID_CONNECTION",
        "message": "Source nodes cannot have incoming edges",
        "node_id": "source_1",
        "edge_id": "temp-validation"
      }
    ]
  }
}
```

### `get_graph`

Request current graph state (useful for reconnection/sync).

**Request:**
```json
{
  "type": "get_graph",
  "payload": {}
}
```

**Response:**
```json
{
  "type": "graph_state",
  "payload": {
    "graph": {
      "dslVersion": "0.2",
      "meta": {
        "name": "My Graph",
        "seed": 12345
      },
      "resources": [],
      "nodes": [
        {
          "id": "source_1",
          "type": "core.Source",
          "params": {
            "ratePerSec": 10
          },
          "position": {
            "x": 100,
            "y": 200
          }
        }
      ],
      "edges": [
        {
          "id": "edge_1",
          "from": "source_1",
          "to": "pool_1",
          "params": {
            "sourceHandle": "bottom-1",
            "targetHandle": "top-1"
          }
        }
      ]
    }
  }
}
```

## Backend → Frontend Messages

### `session_created`

Sent automatically when WebSocket connection is established.

**Message:**
```json
{
  "type": "session_created",
  "payload": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "graph": {
      "dslVersion": "0.2",
      "meta": {
        "name": "",
        "seed": 12345
      },
      "resources": [],
      "nodes": [],
      "edges": []
    }
  }
}
```

### `error`

Error response for any request.

**Message:**
```json
{
  "type": "error",
  "payload": {
    "message": "Node not found",
    "code": "NODE_NOT_FOUND",
    "node_id": "source_1"
  }
}
```

## Error Codes

- `INVALID_JSON`: Malformed JSON in request
- `UNKNOWN_MESSAGE_TYPE`: Unknown message type
- `MISSING_REQUIRED_FIELDS`: Required fields missing in payload
- `DUPLICATE_NODE_ID`: Node ID already exists
- `DUPLICATE_EDGE_ID`: Edge ID already exists
- `NODE_NOT_FOUND`: Node does not exist
- `EDGE_NOT_FOUND`: Edge does not exist
- `INVALID_CONNECTION`: Connection validation failed (node-type-specific)
- `SERVER_ERROR`: Internal server error

## Connection Lifecycle

1. **Connect**: Frontend opens WebSocket connection
2. **Session Created**: Backend sends `session_created` with empty graph
3. **Actions**: Frontend sends incremental actions (`create_node`, `create_edge`, etc.)
4. **Responses**: Backend responds with confirmation or validation errors
5. **Disconnect**: WebSocket closes, session is destroyed

## Reconnection

If the WebSocket connection is lost:

1. Frontend should attempt to reconnect
2. On reconnect, backend creates a new session (empty graph)
3. Frontend should send `get_graph` to restore state (future: add persistence)
4. Or: Frontend can rebuild graph by sending all `create_node`/`create_edge` actions

## Future: Simulation Messages

The following messages will be added in future iterations:

- `start_simulation`: Start simulation with current graph
- `step_simulation`: Execute one simulation step
- `pause_simulation`: Pause running simulation
- `reset_simulation`: Reset simulation state
- `simulation_state`: Updated simulation state (nodeState, tokens, etc.)
