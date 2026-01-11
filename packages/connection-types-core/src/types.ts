/**
 * Connection type definition interface (plugin contract)
 */

export interface ConnectionTypeDefinition {
  typeId: string; // "resource", "state", "trigger"
  display: {
    label: string;
    category?: string;
    icon?: string;
  };
  paramsSchema: unknown; // Zod schema (avoid importing zod in types)
  validateConnection?: (
    fromNodeId: string,
    toNodeId: string,
    sourceHandle?: string,
    targetHandle?: string
  ) => ValidationIssue[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  connectionId?: string;
  nodeId?: string;
}
