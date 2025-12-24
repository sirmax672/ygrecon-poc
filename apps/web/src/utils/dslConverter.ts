import type { GraphDSL } from '@ygrecon/dsl';
import type { Node, Edge } from '@xyflow/react';

/**
 * Normalize handle ID - remove -target suffix if present, keep base ID
 */
function normalizeHandleId(handleId: string | null | undefined): string | undefined {
  if (!handleId) return undefined;
  // Remove -target suffix if present (e.g., "top-1-target" -> "top-1")
  return handleId.replace(/-target$/, '');
}

/**
 * Convert DSL graph to XYFlow nodes and edges
 */
export function dslToXYFlow(dsl: GraphDSL): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = dsl.nodes.map((node) => ({
    id: node.id,
    type: 'custom',
    position: { x: 0, y: 0 }, // Will be set from saved position or default
    data: {
      label: node.id,
      type: node.type,
      params: node.params,
    },
  }));

  const edges: Edge[] = dsl.edges.map((edge) => {
    const sourceHandle = normalizeHandleId(edge.params.sourceHandle as string | undefined);
    const targetHandle = normalizeHandleId(edge.params.targetHandle as string | undefined);
    
    return {
      id: edge.id,
      source: edge.from,
      target: edge.to,
      // Source handles use base ID, target handles use base ID + "-target"
      sourceHandle: sourceHandle,
      targetHandle: targetHandle ? `${targetHandle}-target` : undefined,
      markerEnd: {
        type: 'arrowclosed',
      },
      data: {
        params: edge.params,
      },
    };
  });

  return { nodes, edges };
}

/**
 * Convert XYFlow nodes and edges to DSL graph
 */
export function xyFlowToDSL(
  nodes: Node[],
  edges: Edge[],
  baseDSL: GraphDSL
): GraphDSL {
  return {
    ...baseDSL,
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.data.type as string,
      params: node.data.params as Record<string, unknown>,
    })),
    edges: edges.map((edge) => {
      // Normalize handle IDs - remove -target suffix for storage
      const sourceHandle = normalizeHandleId(edge.sourceHandle);
      const targetHandle = normalizeHandleId(edge.targetHandle);
      
      return {
        id: edge.id,
        from: edge.source,
        to: edge.target,
        params: {
          ...(edge.data?.params as Record<string, unknown> | undefined),
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
        },
      };
    }),
  };
}

