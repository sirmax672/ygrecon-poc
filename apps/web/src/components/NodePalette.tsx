import { useEditorStore } from '../store/editorStore';
import { nodeTypeRegistry } from '@ygrecon/core';
import { connectionTypeRegistry } from '@ygrecon/connection-types-core';
import { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import { getWebSocketClient } from '../services/websocket';

export function NodePalette() {
  const { 
    nodes, 
    setNodes, 
    dsl, 
    setDSL,
    connectionCreationMode,
    setConnectionCreationMode,
    setConnectionCreationSourceNodeId,
    selectedConnectionType,
    setSelectedConnectionType,
    setValidationErrors,
    // Backward compatibility aliases
    edgeCreationMode,
    setEdgeCreationMode,
  } = useEditorStore();
  const nodeTypes = nodeTypeRegistry.getAll();
  const connectionTypes = connectionTypeRegistry.getAll();
  
  const handleAddNode = useCallback(async (typeId: string) => {
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
    
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };
    
    // Create new node locally first (optimistic update)
    const newNode: Node = {
      id: nodeId,
      type: 'custom',
      position,
      data: {
        label: nodeId,
        type: typeId,
        params: {},
      },
    };
    
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    
    // Send to backend
    try {
      const wsClient = getWebSocketClient();
      const result = await wsClient.createNode(nodeId, typeId, {}, position);
      
      if (!result.valid && result.issues) {
        // Validation failed, remove node
        setNodes(nodes);
        const errorMessages = result.issues.map(
          (issue) => `${issue.code}: ${issue.message}`
        );
        setValidationErrors(errorMessages);
      } else {
        // Success, update DSL
        const newDSL = {
          ...dsl,
          nodes: [
            ...dsl.nodes,
            {
              id: nodeId,
              type: typeId,
              params: {},
              visual: {
                position,
              },
            },
          ],
        };
        setDSL(newDSL);
        setValidationErrors([]);
      }
    } catch (error) {
      console.error('Failed to create node:', error);
      // On error, keep the node (fail open)
      const newDSL = {
        ...dsl,
        nodes: [
          ...dsl.nodes,
          {
            id: nodeId,
            type: typeId,
            params: {},
            visual: {
              position,
            },
          },
        ],
      };
      setDSL(newDSL);
    }
  }, [nodes, dsl, setNodes, setDSL, setValidationErrors]);
  
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
      
      {/* Connection creation mode button */}
      <button
        onClick={() => setConnectionCreationMode(!connectionCreationMode)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: connectionCreationMode ? '#007bff' : '#fff',
          color: connectionCreationMode ? '#fff' : '#000',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
        onMouseEnter={(e) => {
          if (!connectionCreationMode) {
            e.currentTarget.style.backgroundColor = '#e9ecef';
          }
        }}
        onMouseLeave={(e) => {
          if (!connectionCreationMode) {
            e.currentTarget.style.backgroundColor = '#fff';
          }
        }}
      >
        {connectionCreationMode ? '✓ Create Connection (Select type, click 2 nodes)' : '+ Create Connection'}
      </button>
      
      {connectionCreationMode && (
        <div
          style={{
            padding: '8px',
            marginBottom: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#856404',
          }}
        >
          {selectedConnectionType ? (
            <>Selected: <strong>{connectionTypes.find(ct => ct.typeId === selectedConnectionType)?.display.label || selectedConnectionType}</strong><br/>Click on source node, then target node</>
          ) : (
            <>Select connection type below, then click on source node, then target node</>
          )}
        </div>
      )}
      
      {/* Connection Types */}
      {connectionCreationMode && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666',
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            Connection Types
          </div>
          {connectionTypes.map((connectionType) => (
            <button
              key={connectionType.typeId}
              onClick={() => setSelectedConnectionType(connectionType.typeId)}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '4px',
                textAlign: 'left',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: selectedConnectionType === connectionType.typeId ? '#007bff' : '#fff',
                color: selectedConnectionType === connectionType.typeId ? '#fff' : '#000',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                if (selectedConnectionType !== connectionType.typeId) {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedConnectionType !== connectionType.typeId) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
            >
              {connectionType.display.label}
            </button>
          ))}
        </div>
      )}
      
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
              disabled={connectionCreationMode}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '4px',
                textAlign: 'left',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: connectionCreationMode ? '#f5f5f5' : '#fff',
                color: connectionCreationMode ? '#999' : '#000',
                cursor: connectionCreationMode ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: connectionCreationMode ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!connectionCreationMode) {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }
              }}
              onMouseLeave={(e) => {
                if (!connectionCreationMode) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
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

