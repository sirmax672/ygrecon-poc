import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useEditorStore } from '../store/editorStore';
import { nodeTypeRegistry } from '@ygrecon/core';

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

export function CustomNode({ id, data, selected }: NodeProps) {
  const nodeType = nodeTypeRegistry.get(data.type as string);
  const { setSelectedNodeId } = useEditorStore();
  
  const handleClick = () => {
    setSelectedNodeId(id);
  };
  
  return (
    <div
      className={`custom-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{
        padding: '10px',
        borderRadius: '8px',
        border: selected ? '2px solid #007bff' : '2px solid #ccc',
        backgroundColor: '#fff',
        minWidth: '120px',
        cursor: 'pointer',
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

