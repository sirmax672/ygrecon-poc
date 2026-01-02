import { Handle, Position, type NodeProps, type Edge } from '@xyflow/react';
import { useEditorStore } from '../store/editorStore';
import { nodeTypeRegistry } from '@ygrecon/core';
import { validateConnections, type ValidationIssue } from '@ygrecon/core';
import { xyFlowToDSL } from '../utils/dslConverter';

/**
 * Generate handle IDs for all 12 handles (3 per side)
 */
const HANDLE_IDS = [
  // Top side (3 handles)
  'top-1', 'top-2', 'top-3',
  // Right side (3 handles)
  'right-1', 'right-2', 'right-3',
  // Bottom side (3 handles)
  'bottom-1', 'bottom-2', 'bottom-3',
  // Left side (3 handles)
  'left-1', 'left-2', 'left-3',
];

/**
 * Calculate handle position on node based on handle ID and node position/size
 */
function getHandlePosition(
  handleId: string,
  nodePosition: { x: number; y: number },
  nodeWidth: number = 120,
  nodeHeight: number = 80
): { x: number; y: number } {
  // Remove -target suffix if present
  const baseHandleId = handleId.replace(/-target$/, '');
  
  // Node center (assuming node is positioned by center in React Flow)
  const centerX = nodePosition.x;
  const centerY = nodePosition.y;
  
  // Half dimensions
  const halfWidth = nodeWidth / 2;
  const halfHeight = nodeHeight / 2;
  
  // Handle positions are at 25%, 50%, 75% along each side
  const positions = [0.25, 0.5, 0.75];
  
  if (baseHandleId.startsWith('top-')) {
    const index = parseInt(baseHandleId.split('-')[1]) - 1;
    return {
      x: centerX - halfWidth + (nodeWidth * positions[index]),
      y: centerY - halfHeight,
    };
  } else if (baseHandleId.startsWith('right-')) {
    const index = parseInt(baseHandleId.split('-')[1]) - 1;
    return {
      x: centerX + halfWidth,
      y: centerY - halfHeight + (nodeHeight * positions[index]),
    };
  } else if (baseHandleId.startsWith('bottom-')) {
    const index = parseInt(baseHandleId.split('-')[1]) - 1;
    return {
      x: centerX - halfWidth + (nodeWidth * positions[index]),
      y: centerY + halfHeight,
    };
  } else if (baseHandleId.startsWith('left-')) {
    const index = parseInt(baseHandleId.split('-')[1]) - 1;
    return {
      x: centerX - halfWidth,
      y: centerY - halfHeight + (nodeHeight * positions[index]),
    };
  }
  
  // Default to center
  return { x: centerX, y: centerY };
}

/**
 * Find closest handles between two nodes
 */
function findClosestHandles(
  sourceNode: { id: string; position: { x: number; y: number } },
  targetNode: { id: string; position: { x: number; y: number } }
): { sourceHandle: string; targetHandle: string } {
  let minDistance = Infinity;
  let bestSourceHandle = 'bottom-1';
  let bestTargetHandle = 'top-1-target';
  
  // Check all source handles against all target handles
  for (const sourceHandleId of HANDLE_IDS) {
    const sourcePos = getHandlePosition(sourceHandleId, sourceNode.position);
    
    for (const targetHandleId of HANDLE_IDS) {
      const targetPos = getHandlePosition(
        `${targetHandleId}-target`,
        targetNode.position
      );
      
      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(targetPos.x - sourcePos.x, 2) +
        Math.pow(targetPos.y - sourcePos.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        bestSourceHandle = sourceHandleId;
        bestTargetHandle = `${targetHandleId}-target`;
      }
    }
  }
  
  return {
    sourceHandle: bestSourceHandle,
    targetHandle: bestTargetHandle,
  };
}

export function CustomNode({ id, data, selected }: NodeProps) {
  const nodeType = nodeTypeRegistry.get(data.type as string);
  const { 
    setSelectedNodeId,
    edgeCreationMode,
    edgeCreationSourceNodeId,
    setEdgeCreationSourceNodeId,
    setEdgeCreationMode,
    edges,
    setEdges,
    dsl,
    setDSL,
    nodes,
    setValidationErrors,
  } = useEditorStore();
  
  const handleClick = () => {
    if (edgeCreationMode) {
      // Edge creation mode: select source, then target
      if (!edgeCreationSourceNodeId) {
        // First click: set as source
        setEdgeCreationSourceNodeId(id);
      } else if (edgeCreationSourceNodeId === id) {
        // Clicked same node: cancel
        setEdgeCreationSourceNodeId(null);
      } else {
        // Second click: create edge
        createEdge(edgeCreationSourceNodeId, id);
        // Reset edge creation mode
        setEdgeCreationMode(false);
        setEdgeCreationSourceNodeId(null);
      }
    } else {
      // Normal mode: select node
      setSelectedNodeId(id);
    }
  };
  
  const createEdge = (sourceId: string, targetId: string) => {
    if (!dsl) return;
    
    // Get node positions
    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);
    
    if (!sourceNode || !targetNode) return;
    
    // Find closest handles between nodes
    const { sourceHandle, targetHandle } = findClosestHandles(
      { id: sourceId, position: sourceNode.position },
      { id: targetId, position: targetNode.position }
    );
    
    // Generate unique edge ID
    let counter = 1;
    let edgeId = `edge_${counter}`;
    while (edges.some((e) => e.id === edgeId)) {
      counter++;
      edgeId = `edge_${counter}`;
    }
    
    // Create temporary edge for validation
    const tempEdge: Edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: 'polyline',
      sourceHandle,
      targetHandle,
      markerEnd: {
        type: 'arrowclosed',
      },
      data: {
        params: {},
        points: [],
      },
    };
    
    // Validate connection before creating it
    const tempEdges = [...edges, tempEdge];
    const tempDSL = xyFlowToDSL(nodes, tempEdges, dsl);
    const issues = validateConnections(tempDSL);
    
    // Filter only connection-related issues for this specific edge
    const connectionIssues = issues.filter(
      (issue: ValidationIssue) =>
        issue.edgeId === edgeId &&
        (issue.code === 'DUPLICATE_CONNECTION' ||
          issue.code === 'REVERSE_CONNECTION_ON_SAME_HANDLES' ||
          issue.code?.startsWith('INVALID_'))
    );
    
    if (connectionIssues.length > 0) {
      // Show validation errors and prevent edge creation
      const errorMessages = connectionIssues.map(
        (issue: ValidationIssue) => `${issue.code}: ${issue.message}`
      );
      setValidationErrors(errorMessages);
      return;
    }
    
    // Clear validation errors if connection is valid
    setValidationErrors([]);
    
    // Connection is valid, create the edge
    setEdges(tempEdges);
    
    // Update DSL
    const newDSL = xyFlowToDSL(nodes, tempEdges, dsl);
    setDSL(newDSL);
  };
  
  return (
    <div
      className={`custom-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{
        padding: '10px',
        borderRadius: '8px',
        border: edgeCreationSourceNodeId === id 
          ? '2px solid #28a745' 
          : selected 
            ? '2px solid #007bff' 
            : '2px solid #ccc',
        backgroundColor: edgeCreationSourceNodeId === id ? '#d4edda' : '#fff',
        minWidth: '120px',
        cursor: edgeCreationMode ? 'crosshair' : 'pointer',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        {nodeType?.display.label || String(data.type || 'Unknown')}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        {id}
      </div>
      
      {/* Top handles (3) */}
      {HANDLE_IDS.slice(0, 3).map((handleId, index) => (
        <Handle
          key={handleId}
          type="source"
          position={Position.Top}
          id={handleId}
          style={{
            left: `${25 + index * 25}%`,
            background: '#555',
          }}
        />
      ))}
      
      {/* Right handles (3) */}
      {HANDLE_IDS.slice(3, 6).map((handleId, index) => (
        <Handle
          key={handleId}
          type="source"
          position={Position.Right}
          id={handleId}
          style={{
            top: `${25 + index * 25}%`,
            background: '#555',
          }}
        />
      ))}
      
      {/* Bottom handles (3) */}
      {HANDLE_IDS.slice(6, 9).map((handleId, index) => (
        <Handle
          key={handleId}
          type="source"
          position={Position.Bottom}
          id={handleId}
          style={{
            left: `${25 + index * 25}%`,
            background: '#555',
          }}
        />
      ))}
      
      {/* Left handles (3) */}
      {HANDLE_IDS.slice(9, 12).map((handleId, index) => (
        <Handle
          key={handleId}
          type="source"
          position={Position.Left}
          id={handleId}
          style={{
            top: `${25 + index * 25}%`,
            background: '#555',
          }}
        />
      ))}
      
      {/* Target handles - same positions, but for receiving connections */}
      {/* Top target handles */}
      {HANDLE_IDS.slice(0, 3).map((handleId, index) => (
        <Handle
          key={`${handleId}-target`}
          type="target"
          position={Position.Top}
          id={`${handleId}-target`}
          style={{
            left: `${25 + index * 25}%`,
            background: '#777',
            opacity: 0.7,
          }}
        />
      ))}
      
      {/* Right target handles */}
      {HANDLE_IDS.slice(3, 6).map((handleId, index) => (
        <Handle
          key={`${handleId}-target`}
          type="target"
          position={Position.Right}
          id={`${handleId}-target`}
          style={{
            top: `${25 + index * 25}%`,
            background: '#777',
            opacity: 0.7,
          }}
        />
      ))}
      
      {/* Bottom target handles */}
      {HANDLE_IDS.slice(6, 9).map((handleId, index) => (
        <Handle
          key={`${handleId}-target`}
          type="target"
          position={Position.Bottom}
          id={`${handleId}-target`}
          style={{
            left: `${25 + index * 25}%`,
            background: '#777',
            opacity: 0.7,
          }}
        />
      ))}
      
      {/* Left target handles */}
      {HANDLE_IDS.slice(9, 12).map((handleId, index) => (
        <Handle
          key={`${handleId}-target`}
          type="target"
          position={Position.Left}
          id={`${handleId}-target`}
          style={{
            top: `${25 + index * 25}%`,
            background: '#777',
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

