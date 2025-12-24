import type { GraphDSL } from '@ygrecon/dsl';

/**
 * Node type definition interface (plugin contract)
 */
export interface NodeTypeDefinition {
  typeId: string;
  display: {
    label: string;
    category?: string;
    icon?: string;
  };
  paramsSchema: unknown; // Zod schema (avoid importing zod in types)
  ports: {
    inputs: string[];
    outputs: string[];
  };
  uiSchema?: Record<string, unknown>;
  validate?: (graph: GraphDSL, nodeId: string) => ValidationIssue[];
  validateConnection?: (
    graph: GraphDSL,
    fromNodeId: string,
    toNodeId: string,
    sourceHandle?: string,
    targetHandle?: string
  ) => ValidationIssue[];
  simulate?: unknown; // Will be defined in packages/sim
}

/**
 * Validation issue from graph-level checks
 */
export interface ValidationIssue {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

/**
 * Compiled graph structure (runtime representation)
 */
export interface CompiledGraph {
  nodes: Map<string, GraphDSL['nodes'][0]>;
  edges: Map<string, GraphDSL['edges'][0]>;
  adjacency: Map<string, string[]>; // nodeId -> outgoing edge IDs
  reverseAdjacency: Map<string, string[]>; // nodeId -> incoming edge IDs
}


