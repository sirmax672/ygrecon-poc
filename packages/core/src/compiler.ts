import type { GraphDSL } from '@ygrecon/dsl';
import type { CompiledGraph, ValidationIssue } from './types.js';
import { nodeTypeRegistry } from './registry.js';

/**
 * Compile a validated DSL graph into a runtime structure.
 * Also performs graph-level validation (refs, duplicates).
 */
export function compileGraph(dsl: GraphDSL): {
  graph: CompiledGraph;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const nodes = new Map<string, GraphDSL['nodes'][0]>();
  const edges = new Map<string, GraphDSL['edges'][0]>();
  const adjacency = new Map<string, string[]>();
  const reverseAdjacency = new Map<string, string[]>();

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  for (const node of dsl.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate node ID: ${node.id}`,
        nodeId: node.id,
      });
    } else {
      nodeIds.add(node.id);
      nodes.set(node.id, node);
      adjacency.set(node.id, []);
      reverseAdjacency.set(node.id, []);
    }
  }

  // Check for duplicate edge IDs and validate refs
  const edgeIds = new Set<string>();
  for (const edge of dsl.edges) {
    if (edgeIds.has(edge.id)) {
      issues.push({
        code: 'DUPLICATE_EDGE_ID',
        message: `Duplicate edge ID: ${edge.id}`,
        edgeId: edge.id,
      });
    } else {
      edgeIds.add(edge.id);
    }

    if (!nodes.has(edge.from)) {
      issues.push({
        code: 'MISSING_NODE_REF',
        message: `Edge ${edge.id} references unknown node: ${edge.from}`,
        edgeId: edge.id,
        nodeId: edge.from,
      });
    }
    if (!nodes.has(edge.to)) {
      issues.push({
        code: 'MISSING_NODE_REF',
        message: `Edge ${edge.id} references unknown node: ${edge.to}`,
        edgeId: edge.id,
        nodeId: edge.to,
      });
    }

    if (nodes.has(edge.from) && nodes.has(edge.to)) {
      edges.set(edge.id, edge);
      adjacency.get(edge.from)!.push(edge.id);
      reverseAdjacency.get(edge.to)!.push(edge.id);
    }
  }

  // Check for unknown node types (warn, but don't block)
  for (const node of dsl.nodes) {
    if (!nodeTypeRegistry.has(node.type)) {
      issues.push({
        code: 'UNKNOWN_NODE_TYPE',
        message: `Unknown node type: ${node.type}`,
        nodeId: node.id,
      });
    }
  }

  const graph: CompiledGraph = {
    nodes,
    edges,
    adjacency,
    reverseAdjacency,
  };

  return { graph, issues };
}


