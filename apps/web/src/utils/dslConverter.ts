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
 * Convert DSL graph to XYFlow nodes and edges (connections -> edges for ReactFlow)
 */
export function dslToXYFlow(dsl: GraphDSL): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = dsl.nodes.map((node) => ({
    id: node.id,
    type: 'custom',
    position: node.visual?.position || { x: 0, y: 0 }, // Use visual.position or default
    data: {
      label: node.id,
      type: node.type,
      params: node.params,
    },
  }));

  // Create a Set for quick node ID lookup
  const nodeIds = new Set(nodes.map(n => n.id));

  // Use connections if available, otherwise fall back to edges (backward compatibility)
  const connections = dsl.connections || dsl.edges || [];
  
  const edges: Edge[] = connections
    .map((conn) => {
      // Support both variants: "from" (alias) and "from_" (Python field name)
      const sourceNodeId = (conn as any).from || (conn as any).from_;
      const targetNodeId = conn.to;

      // Validate: both nodes must exist
      if (!nodeIds.has(sourceNodeId) || !nodeIds.has(targetNodeId)) {
        console.warn(
          `Connection ${conn.id} skipped: source=${sourceNodeId} or target=${targetNodeId} not found in nodes`
        );
        return null;
      }

      // Get handles from visual or params (backward compatibility)
      const sourceHandle = normalizeHandleId(
        (conn as any).visual?.sourceHandle || (conn as any).params?.sourceHandle as string | undefined
      );
      const targetHandle = normalizeHandleId(
        (conn as any).visual?.targetHandle || (conn as any).params?.targetHandle as string | undefined
      );
      const points = (conn as any).visual?.points || (conn as any).params?.points as Array<{ x: number; y: number }> | undefined;
      const label = conn.params.label as string | undefined;
      const formula = conn.params.formula as string | undefined;
      const formulaPosition = conn.params.formulaPosition as number | undefined;
      const connectionType = (conn as any).type || 'resource'; // Default to resource for backward compatibility

      // Use polyline type for all connections (allows adding points)
      return {
        id: conn.id,
        source: sourceNodeId,
        target: targetNodeId,
        type: 'polyline',
        // Source handles use base ID, target handles use base ID + "-target"
        sourceHandle: sourceHandle,
        targetHandle: targetHandle ? `${targetHandle}-target` : undefined,
        markerEnd: {
          type: 'arrowclosed',
        },
        data: {
          type: connectionType, // Store connection type in data
          params: {
            ...conn.params,
            label: label || '',
            formula: formula || '',
            formulaPosition: formulaPosition ?? 0.5,
          },
          points: points || [], // Store points in edge.data for PolylineEdge component
        },
      };
    })
    .filter((edge): edge is Edge => edge !== null); // Remove null edges

  return { nodes, edges };
}

/**
 * Convert XYFlow nodes and edges to DSL graph (edges -> connections)
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
      visual: {
        position: node.position, // Save node position in visual
      },
    })),
    connections: edges.map((edge) => {
      // Normalize handle IDs - remove -target suffix for storage
      const sourceHandle = normalizeHandleId(edge.sourceHandle);
      const targetHandle = normalizeHandleId(edge.targetHandle);
      
      // Extract points from edge.data if present (for polyline edges)
      const points = edge.data?.points as Array<{ x: number; y: number }> | undefined;
      
      // Get connection type from edge.data.type (default to "resource")
      const connectionType = (edge.data as any)?.type || 'resource';
      
      // Build params object (semantic properties only, not visual)
      const connectionParams: Record<string, unknown> = {
        ...(edge.data?.params as Record<string, unknown> | undefined),
      };
      
      // Remove visual properties from params (they go to visual)
      delete connectionParams.sourceHandle;
      delete connectionParams.targetHandle;
      delete connectionParams.points;
      
      // Persist label and formula (semantic properties that might be in params)
      const label = connectionParams.label as string | undefined;
      const formula = connectionParams.formula as string | undefined;
      const formulaPosition = connectionParams.formulaPosition as number | undefined;
      
      // Only save label if not empty
      if (label) {
        connectionParams.label = label;
      }
      
      // Only save formula and its position if formula exists
      if (formula) {
        connectionParams.formula = formula;
        if (formulaPosition !== undefined) {
          connectionParams.formulaPosition = formulaPosition;
        }
      }
      
      // Build visual object
      const visual: any = {};
      if (sourceHandle !== undefined) {
        visual.sourceHandle = sourceHandle;
      }
      if (targetHandle !== undefined) {
        visual.targetHandle = targetHandle;
      }
      if (points && points.length > 0) {
        visual.points = points;
      }
      
      return {
        id: edge.id,
        type: connectionType,
        from: edge.source,
        to: edge.target,
        params: connectionParams,
        visual: Object.keys(visual).length > 0 ? visual : undefined,
      };
    }),
  };
}

