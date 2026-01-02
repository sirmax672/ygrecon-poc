/**
 * WebSocket client service for backend communication.
 * Implements session-based protocol with incremental actions.
 */

type MessageType =
  | 'create_node'
  | 'update_node'
  | 'delete_node'
  | 'create_edge'
  | 'update_edge'
  | 'delete_edge'
  | 'validate_connection'
  | 'get_graph'
  | 'session_created'
  | 'node_created'
  | 'node_updated'
  | 'node_deleted'
  | 'edge_created'
  | 'edge_updated'
  | 'edge_deleted'
  | 'validation_result'
  | 'graph_state'
  | 'error';

interface BaseMessage {
  type: MessageType;
  payload: unknown;
}

interface CreateNodeRequest {
  type: 'create_node';
  payload: {
    node_id: string;
    node_type: string;
    params: Record<string, unknown>;
    position?: { x: number; y: number };
  };
}

interface UpdateNodeRequest {
  type: 'update_node';
  payload: {
    node_id: string;
    params?: Record<string, unknown>;
    position?: { x: number; y: number };
  };
}

interface DeleteNodeRequest {
  type: 'delete_node';
  payload: {
    node_id: string;
  };
}

interface CreateEdgeRequest {
  type: 'create_edge';
  payload: {
    edge_id: string;
    from_node_id: string;
    to_node_id: string;
    source_handle?: string;
    target_handle?: string;
    params?: Record<string, unknown>;
  };
}

interface UpdateEdgeRequest {
  type: 'update_edge';
  payload: {
    edge_id: string;
    params: Record<string, unknown>;
  };
}

interface DeleteEdgeRequest {
  type: 'delete_edge';
  payload: {
    edge_id: string;
  };
}

interface ValidateConnectionRequest {
  type: 'validate_connection';
  payload: {
    from_node_id: string;
    to_node_id: string;
    source_handle?: string;
    target_handle?: string;
    edge_id?: string;
    mode?: 'preliminary' | 'final';
  };
}

interface GetGraphRequest {
  type: 'get_graph';
  payload: {};
}

interface SessionCreatedResponse {
  type: 'session_created';
  payload: {
    session_id: string;
    graph: unknown; // GraphDSL
  };
}

interface NodeCreatedResponse {
  type: 'node_created';
  payload: {
    node_id: string;
    valid: boolean;
    issues?: Array<{
      code: string;
      message: string;
      node_id?: string;
    }>;
  };
}

interface EdgeCreatedResponse {
  type: 'edge_created';
  payload: {
    edge_id: string;
    valid: boolean;
    issues?: Array<{
      code: string;
      message: string;
      node_id?: string;
      edge_id?: string;
    }>;
  };
}

interface ValidationResultResponse {
  type: 'validation_result';
  payload: {
    valid: boolean;
    issues: Array<{
      code: string;
      message: string;
      node_id?: string;
      edge_id?: string;
    }>;
  };
}

interface GraphStateResponse {
  type: 'graph_state';
  payload: {
    graph: unknown; // GraphDSL
  };
}

interface ErrorResponse {
  type: 'error';
  payload: {
    message: string;
    code: string;
    node_id?: string;
    edge_id?: string;
  };
}

type WebSocketRequest =
  | CreateNodeRequest
  | UpdateNodeRequest
  | DeleteNodeRequest
  | CreateEdgeRequest
  | UpdateEdgeRequest
  | DeleteEdgeRequest
  | ValidateConnectionRequest
  | GetGraphRequest;

type WebSocketResponse =
  | SessionCreatedResponse
  | NodeCreatedResponse
  | EdgeCreatedResponse
  | ValidationResultResponse
  | GraphStateResponse
  | ErrorResponse;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;
  private sessionId: string | null = null;
  private messageHandlers: Map<string, Set<(response: WebSocketResponse) => void>> = new Map();

  constructor(url?: string) {
    // Use Vite proxy in development, direct connection in production
    if (url) {
      this.url = url;
    } else if (import.meta.env.DEV) {
      // In development, use Vite proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host; // localhost:5173
      this.url = `${protocol}//${host}/ws`;
    } else {
      // In production, use direct connection
      this.url = 'ws://localhost:8000/ws';
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Connecting to WebSocket:', this.url);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected to:', this.url);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed', event.code, event.reason);
          this.ws = null;
          this.sessionId = null;
          // Only attempt reconnect if it wasn't a manual close
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketResponse = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketResponse): void {
    console.log('Received WebSocket message:', message.type, message);
    
    // Handle session_created
    if (message.type === 'session_created') {
      this.sessionId = message.payload.session_id;
      console.log('Session created:', this.sessionId);
    }

    // Route to registered handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      console.log(`Found ${handlers.size} handler(s) for type: ${message.type}`);
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    } else {
      console.warn(`No handlers registered for message type: ${message.type}`);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect().catch(() => {
          // Reconnect will be attempted again
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.sessionId = null;
    }
  }

  private ensureConnected(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
  }

  private sendMessage(
    message: WebSocketRequest,
    expectedResponseType: string
  ): Promise<WebSocketResponse> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        this.removeMessageHandler(expectedResponseType, messageHandler);
        reject(new Error('Request timeout'));
      }, 10000); // Increased timeout to 10 seconds

      const messageHandler = (response: WebSocketResponse) => {
        clearTimeout(timeout);
        this.removeMessageHandler(expectedResponseType, messageHandler);
        resolve(response);
      };

      this.addMessageHandler(expectedResponseType, messageHandler);
      console.log('Sending WebSocket message:', message.type, 'expecting response:', expectedResponseType);
      this.ws.send(JSON.stringify(message));
    });
  }

  private addMessageHandler(type: string, handler: (response: WebSocketResponse) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  private removeMessageHandler(type: string, handler: (response: WebSocketResponse) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  // Public API methods

  async createNode(
    nodeId: string,
    nodeType: string,
    params: Record<string, unknown>,
    position?: { x: number; y: number }
  ): Promise<NodeCreatedResponse['payload']> {
    const response = await this.sendMessage(
      {
        type: 'create_node',
        payload: { node_id: nodeId, node_type: nodeType, params, position },
      },
      'node_created' // Expected response type
    );

    if (response.type === 'node_created') {
      return response.payload;
    } else if (response.type === 'error') {
      throw new Error(response.payload.message);
    } else {
      throw new Error(`Unexpected response type: ${response.type}`);
    }
  }

  async updateNode(
    nodeId: string,
    params?: Record<string, unknown>,
    position?: { x: number; y: number }
  ): Promise<void> {
    const response = await this.sendMessage(
      {
        type: 'update_node',
        payload: { node_id: nodeId, params, position },
      },
      'node_updated' // Expected response type
    );

    if (response.type === 'error') {
      throw new Error(response.payload.message);
    }
  }

  async deleteNode(nodeId: string): Promise<void> {
    const response = await this.sendMessage(
      {
        type: 'delete_node',
        payload: { node_id: nodeId },
      },
      'node_deleted' // Expected response type
    );

    if (response.type === 'error') {
      throw new Error(response.payload.message);
    }
  }

  async createEdge(
    edgeId: string,
    fromNodeId: string,
    toNodeId: string,
    sourceHandle?: string,
    targetHandle?: string,
    params?: Record<string, unknown>
  ): Promise<EdgeCreatedResponse['payload']> {
    const response = await this.sendMessage(
      {
        type: 'create_edge',
        payload: {
          edge_id: edgeId,
          from_node_id: fromNodeId,
          to_node_id: toNodeId,
          source_handle: sourceHandle,
          target_handle: targetHandle,
          params,
        },
      },
      'edge_created' // Expected response type
    );

    if (response.type === 'edge_created') {
      return response.payload;
    } else if (response.type === 'error') {
      throw new Error(response.payload.message);
    } else {
      throw new Error(`Unexpected response type: ${response.type}`);
    }
  }

  async updateEdge(edgeId: string, params: Record<string, unknown>): Promise<void> {
    const response = await this.sendMessage(
      {
        type: 'update_edge',
        payload: { edge_id: edgeId, params },
      },
      'edge_updated' // Expected response type
    );

    if (response.type === 'error') {
      throw new Error(response.payload.message);
    }
  }

  async deleteEdge(edgeId: string): Promise<void> {
    const response = await this.sendMessage(
      {
        type: 'delete_edge',
        payload: { edge_id: edgeId },
      },
      'edge_deleted' // Expected response type
    );

    if (response.type === 'error') {
      throw new Error(response.payload.message);
    }
  }

  async validateConnection(
    fromNodeId: string,
    toNodeId: string,
    sourceHandle: string | undefined,
    targetHandle: string | undefined,
    edgeId?: string,
    mode: 'preliminary' | 'final' = 'final'
  ): Promise<ValidationResultResponse['payload']> {
    const response = await this.sendMessage(
      {
        type: 'validate_connection',
        payload: {
          from_node_id: fromNodeId,
          to_node_id: toNodeId,
          source_handle: sourceHandle,
          target_handle: targetHandle,
          edge_id: edgeId,
          mode,
        },
      },
      'validation_result' // Expected response type
    );

    if (response.type === 'validation_result') {
      return response.payload;
    } else if (response.type === 'error') {
      throw new Error(response.payload.message);
    } else {
      throw new Error(`Unexpected response type: ${response.type}`);
    }
  }

  async getGraph(): Promise<GraphStateResponse['payload']> {
    const response = await this.sendMessage(
      {
        type: 'get_graph',
        payload: {},
      },
      'graph_state' // Expected response type
    );

    if (response.type === 'graph_state') {
      return response.payload;
    } else if (response.type === 'error') {
      throw new Error(response.payload.message);
    } else {
      throw new Error(`Unexpected response type: ${response.type}`);
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
}
