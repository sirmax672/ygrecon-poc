import { useEditorStore } from '../store/editorStore';
import { nodeTypeRegistry } from '@ygrecon/core';
import { useCallback } from 'react';
import type { Node } from '@xyflow/react';

export function NodePalette() {
  const { nodes, setNodes, dsl, setDSL } = useEditorStore();
  const nodeTypes = nodeTypeRegistry.getAll();
  
  const handleAddNode = useCallback((typeId: string) => {
    if (!dsl) return;
    
    const nodeType = nodeTypeRegistry.get(typeId);
    if (!nodeType) return;
    
    // Generate unique ID
    const baseId = typeId.split('.').pop()?.toLowerCase() || 'node';
    let counter = 1;
    let nodeId = `${baseId}_${counter}`;
    while (nodes.some((n) => n.id === nodeId)) {
      counter++;
      nodeId = `${baseId}_${counter}`;
    }
    
    // Create new node
    const newNode: Node = {
      id: nodeId,
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: nodeId,
        type: typeId,
        params: {},
      },
    };
    
    // Update nodes
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    
    // Update DSL
    const newDSL = {
      ...dsl,
      nodes: [
        ...dsl.nodes,
        {
          id: nodeId,
          type: typeId,
          params: {},
        },
      ],
    };
    setDSL(newDSL);
  }, [nodes, dsl, setNodes, setDSL]);
  
  // Group by category
  const grouped = nodeTypes.reduce((acc, nodeType) => {
    const category = nodeType.display.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(nodeType);
    return acc;
  }, {} as Record<string, typeof nodeTypes>);
  
  return (
    <div
      style={{
        width: '200px',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #ddd',
        padding: '16px',
        overflowY: 'auto',
        height: '100vh',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Node Palette</h3>
      {Object.entries(grouped).map(([category, types]) => (
        <div key={category} style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666',
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            {category}
          </div>
          {types.map((nodeType) => (
            <button
              key={nodeType.typeId}
              onClick={() => handleAddNode(nodeType.typeId)}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '4px',
                textAlign: 'left',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              {nodeType.display.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

