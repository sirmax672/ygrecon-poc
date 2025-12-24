import type { GraphDSL } from '@ygrecon/dsl';
import type { ValidationIssue } from './types.js';
import { nodeTypeRegistry } from './registry.js';

/**
 * Normalize handle ID - remove -target suffix if present, keep base ID
 */
function normalizeHandleId(handleId: string | null | undefined): string | undefined {
  if (!handleId) return undefined;
  // Remove -target suffix if present (e.g., "top-1-target" -> "top-1")
  return handleId.replace(/-target$/, '');
}

/**
 * Extract handle IDs from edge params
 */
function getEdgeHandles(edge: GraphDSL['edges'][0]): {
  sourceHandle?: string;
  targetHandle?: string;
} {
  const sourceHandle = normalizeHandleId(edge.params.sourceHandle as string | undefined);
  const targetHandle = normalizeHandleId(edge.params.targetHandle as string | undefined);
  return { sourceHandle, targetHandle };
}

/**
 * Validate all edge connections in a graph.
 * Performs base-level structural checks and delegates node-type-specific
 * validation to node type plugins.
 *
 * @param dsl - The graph DSL to validate
 * @returns Array of validation issues (empty if all valid)
 */
export function validateConnections(dsl: GraphDSL): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeMap = new Map<string, GraphDSL['nodes'][0]>();
  const edgesByDirection = new Map<string, GraphDSL['edges'][0][]>(); // "from->to" -> edges[]
  const edgesByHandles = new Map<string, GraphDSL['edges'][0]>(); // "from[handleX]->to[handleY]" -> edge

  // Build node map
  for (const node of dsl.nodes) {
    nodeMap.set(node.id, node);
  }

  // Build edge maps and validate base rules
  for (const edge of dsl.edges) {
    // Skip if nodes don't exist (this is checked in compiler.ts)
    if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) {
      continue;
    }

    const directionKey = `${edge.from}->${edge.to}`;
    const { sourceHandle, targetHandle } = getEdgeHandles(edge);

    // Rule 1: No duplicate connections in the same direction
    if (!edgesByDirection.has(directionKey)) {
      edgesByDirection.set(directionKey, []);
    }
    const existingInDirection = edgesByDirection.get(directionKey)!;
    
    // Check if this edge is a duplicate (same from->to, regardless of handles)
    const isDuplicate = existingInDirection.some(
      (e) => e.id !== edge.id && e.from === edge.from && e.to === edge.to
    );
    
    if (isDuplicate) {
      issues.push({
        code: 'DUPLICATE_CONNECTION',
        message: `Duplicate connection from ${edge.from} to ${edge.to}. Only one edge allowed per direction.`,
        edgeId: edge.id,
        nodeId: edge.from,
      });
    } else {
      existingInDirection.push(edge);
    }

    // Rule 2: No reverse connection using the same handles
    if (sourceHandle && targetHandle) {
      const handleKey = `${edge.from}[${sourceHandle}]->${edge.to}[${targetHandle}]`;
      const reverseHandleKey = `${edge.to}[${targetHandle}]->${edge.from}[${sourceHandle}]`;
      
      if (edgesByHandles.has(reverseHandleKey)) {
        const reverseEdge = edgesByHandles.get(reverseHandleKey)!;
        issues.push({
          code: 'REVERSE_CONNECTION_ON_SAME_HANDLES',
          message: `Cannot create reverse connection ${edge.from}[${sourceHandle}]->${edge.to}[${targetHandle}] because reverse connection ${reverseEdge.id} already exists on the same handles.`,
          edgeId: edge.id,
          nodeId: edge.from,
        });
      } else {
        edgesByHandles.set(handleKey, edge);
      }
    }
  }

  // Delegate to node-type-specific validation
  for (const edge of dsl.edges) {
    if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) {
      continue;
    }

    const fromNode = nodeMap.get(edge.from)!;
    const toNode = nodeMap.get(edge.to)!;
    const { sourceHandle, targetHandle } = getEdgeHandles(edge);

    // Validate from node's perspective
    const fromNodeType = nodeTypeRegistry.get(fromNode.type);
    if (fromNodeType?.validateConnection) {
      const nodeIssues = fromNodeType.validateConnection(
        dsl,
        edge.from,
        edge.to,
        sourceHandle,
        targetHandle
      );
      issues.push(...nodeIssues.map((issue) => ({ ...issue, edgeId: edge.id })));
    }

    // Validate to node's perspective (for incoming connections)
    const toNodeType = nodeTypeRegistry.get(toNode.type);
    if (toNodeType?.validateConnection) {
      // For incoming validation, we swap from/to to represent the connection from the target's perspective
      const nodeIssues = toNodeType.validateConnection(
        dsl,
        edge.to,
        edge.from,
        targetHandle,
        sourceHandle
      );
      issues.push(...nodeIssues.map((issue) => ({ ...issue, edgeId: edge.id })));
    }
  }

  return issues;
}

