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
    position: node.position || { x: 0, y: 0 }, // Use saved position or default
    data: {
      label: node.id,
      type: node.type,
      params: node.params,
    },
  }));

  const edges: Edge[] = dsl.edges.map((edge) => {
    const sourceHandle = normalizeHandleId(edge.params.sourceHandle as string | undefined);
    const targetHandle = normalizeHandleId(edge.params.targetHandle as string | undefined);
    const points = edge.params.points as Array<{ x: number; y: number }> | undefined;
    const label = edge.params.label as string | undefined;
    const formula = edge.params.formula as string | undefined;
    const formulaPosition = edge.params.formulaPosition as number | undefined;
    
    // Use polyline type for all edges (allows adding points to any edge)
    return {
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: 'polyline',
      // Source handles use base ID, target handles use base ID + "-target"
      sourceHandle: sourceHandle,
      targetHandle: targetHandle ? `${targetHandle}-target` : undefined,
      markerEnd: {
        type: 'arrowclosed',
      },
      data: {
        params: {
          ...edge.params,
          label: label || '',
          formula: formula || '',
          formulaPosition: formulaPosition ?? 0.5,
        },
        points: points || [], // Store points in edge.data for PolylineEdge component
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
      position: node.position, // Save node position for visualization
    })),
    edges: edges.map((edge) => {
      // Normalize handle IDs - remove -target suffix for storage
      const sourceHandle = normalizeHandleId(edge.sourceHandle);
      const targetHandle = normalizeHandleId(edge.targetHandle);
      
      // Extract points from edge.data if present (for polyline edges)
      const points = edge.data?.points as Array<{ x: number; y: number }> | undefined;
      
      // Build params object, always including handles and points (if present)
      const edgeParams: Record<string, unknown> = {
        ...(edge.data?.params as Record<string, unknown> | undefined),
      };
      
      // Always save handles (even if undefined, they're part of visualization state)
      if (sourceHandle !== undefined) {
        edgeParams.sourceHandle = sourceHandle;
      }
      if (targetHandle !== undefined) {
        edgeParams.targetHandle = targetHandle;
      }
      
      // Persist points in edge params for DSL round-trip
      if (points && points.length > 0) {
        edgeParams.points = points;
      }
      
      // Persist label and formula (visualization data)
      const label = edgeParams.label as string | undefined;
      const formula = edgeParams.formula as string | undefined;
      const formulaPosition = edgeParams.formulaPosition as number | undefined;
      
      // Only save label if not empty
      if (label) {
        edgeParams.label = label;
      }
      
      // Only save formula and its position if formula exists
      if (formula) {
        edgeParams.formula = formula;
        if (formulaPosition !== undefined) {
          edgeParams.formulaPosition = formulaPosition;
        }
      }
      
      return {
        id: edge.id,
        from: edge.source,
        to: edge.target,
        params: edgeParams,
      };
    }),
  };
}

