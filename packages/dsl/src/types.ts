/**
 * Result type for validation/parsing operations.
 * Never throw raw errors; use Result instead.
 */
export type Result<T, E = ValidationError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Validation error with structured information.
 */
export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  nodeId?: string;
  edgeId?: string; // Keep for backward compatibility
  connectionId?: string; // New name
}

/**
 * DSL v0.2 structure
 */
export interface NodeVisual {
  position?: {
    x: number;
    y: number;
  };
  color?: string;
  shape?: string;
}

export interface ConnectionVisual {
  points?: Array<{ x: number; y: number }>;
  color?: string;
  style?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface GraphDSL {
  dslVersion: '0.2';
  meta: {
    name: string;
    seed: number;
    timeUnit?: string;
    notes?: string;
  };
  resources: Array<{
    id: string;
    label: string;
    description?: string;
    default?: boolean;
    active?: boolean;
    content?: string; // SVG icon/content
  }>;
  nodes: Array<{
    id: string;
    type: string;
    params: Record<string, unknown>;
    visual?: NodeVisual;
  }>;
  connections: Array<{
    id: string;
    type: string; // "resource", "state", "trigger"
    from: string;
    to: string;
    params: Record<string, unknown>;
    visual?: ConnectionVisual;
  }>;
  // Keep edges for backward compatibility when reading
  edges?: Array<{
    id: string;
    from: string;
    to: string;
    params: Record<string, unknown>;
    visual?: ConnectionVisual;
  }>;
}
