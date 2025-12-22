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
  edgeId?: string;
}

/**
 * DSL v0.2 structure
 */
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
  }>;
  nodes: Array<{
    id: string;
    type: string;
    params: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    params: Record<string, unknown>;
  }>;
}


