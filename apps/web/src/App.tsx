import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  reconnectEdge,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type OnReconnect,
  type OnConnectStart,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditorStore } from './store/editorStore';
import { CustomNode } from './components/CustomNode';
import { NodePalette } from './components/NodePalette';
import { RightPanel } from './components/RightPanel';
import { ImportExport } from './components/ImportExport';
import { PolylineEdge } from './components/PolylineEdge';
import { ConnectionLine } from './components/ConnectionLine';
import { xyFlowToDSL } from './utils/dslConverter';
import { getWebSocketClient } from './services/websocket';
import './App.css';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  polyline: PolylineEdge,
};

function Canvas() {
  const {
    nodes,
    edges,
    dsl,
    setNodes,
    setEdges,
    setDSL,
    setSelectedNodeId,
    setSelectedEdgeId,
    setValidationErrors,
    selectedNodeId,
    selectedEdgeId,
  } = useEditorStore();
  
  const { getNode, getEdge } = useReactFlow();
  
  // Track where connection started to determine direction
  const [connectionStartNode, setConnectionStartNode] = useState<string | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const wsClient = getWebSocketClient();
    wsClient.connect().catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
      // Fallback: continue without WebSocket (validation will fail gracefully)
    });

    return () => {
      wsClient.disconnect();
    };
  }, []);
  
  // Debounce timer for position updates
  const positionUpdateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const newNodes = applyNodeChanges(changes, nodes);
      setNodes(newNodes);
      
      // Handle selection and position updates
      const wsClient = getWebSocketClient();
      for (const change of changes) {
        if (change.type === 'select') {
          if (change.selected) {
            setSelectedNodeId(change.id);
          } else if (selectedNodeId === change.id) {
            setSelectedNodeId(null);
          }
        } else if (change.type === 'position' && change.position && dsl) {
          // Debounce position updates to avoid too many server requests
          const node = newNodes.find((n) => n.id === change.id);
          if (node) {
            // Clear existing timer for this node
            const existingTimer = positionUpdateTimers.current.get(change.id);
            if (existingTimer) {
              clearTimeout(existingTimer);
            }
            
            // Set new timer to update position after 300ms of no changes
            const timer = setTimeout(() => {
              wsClient.updateNode(change.id, undefined, {
                x: node.position.x,
                y: node.position.y,
              }).catch((error) => {
                console.error('Failed to update node position on server:', error);
              });
              positionUpdateTimers.current.delete(change.id);
            }, 300);
            
            positionUpdateTimers.current.set(change.id, timer);
          }
        }
      }
      
      // Update DSL when nodes change
      if (dsl) {
        const newDSL = xyFlowToDSL(newNodes, edges, dsl);
        setDSL(newDSL);
      }
    },
    [nodes, edges, dsl, setNodes, setDSL, setSelectedNodeId, selectedNodeId]
  );
  
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const newEdges = applyEdgeChanges(changes, edges);
      setEdges(newEdges);
      
      // Handle selection
      const wsClient = getWebSocketClient();
      for (const change of changes) {
        if (change.type === 'select') {
          if (change.selected) {
            setSelectedEdgeId(change.id);
          } else if (selectedEdgeId === change.id) {
            setSelectedEdgeId(null);
          }
        }
      }
      
      // Update DSL when edges change
      if (dsl) {
        const newDSL = xyFlowToDSL(nodes, newEdges, dsl);
        setDSL(newDSL);
      }
    },
    [nodes, edges, dsl, setEdges, setDSL, setSelectedEdgeId, selectedEdgeId]
  );
  
  const onReconnect: OnReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      // For polyline edges, preserve all points when reconnecting
      // Only the endpoint changes, all intermediate points stay the same
      const oldPoints = (oldEdge.data?.points as Array<{ x: number; y: number }>) || [];
      const oldData = oldEdge.data || {};
      
      // Determine if we're reconnecting source or target by comparing old and new connections
      const sourceChanged = oldEdge.source !== newConnection.source || 
                           oldEdge.sourceHandle !== newConnection.sourceHandle;
      const targetChanged = oldEdge.target !== newConnection.target || 
                           oldEdge.targetHandle !== newConnection.targetHandle;
      
      // If both changed, prefer target (default React Flow behavior)
      // If only source changed, we're reconnecting source
      const isSourceReconnect = sourceChanged && !targetChanged;

      // Normalize handles based on which endpoint is being reconnected
      let normalizedConnection: Connection = { ...newConnection };
      
      if (isSourceReconnect) {
        // Reconnecting source - normalize source handle (remove -target suffix if present)
        if (normalizedConnection.sourceHandle && normalizedConnection.sourceHandle.endsWith('-target')) {
          normalizedConnection.sourceHandle = normalizedConnection.sourceHandle.replace(/-target$/, '');
        }
      } else {
        // Reconnecting target - normalize target handle (add -target suffix if missing)
        if (normalizedConnection.targetHandle && !normalizedConnection.targetHandle.endsWith('-target')) {
          normalizedConnection.targetHandle = `${normalizedConnection.targetHandle}-target`;
        }
      }

      // Validate connection before reconnecting
      if (dsl) {
        const tempEdge: Edge = {
          ...oldEdge,
          source: normalizedConnection.source || oldEdge.source,
          target: normalizedConnection.target || oldEdge.target,
          sourceHandle: normalizedConnection.sourceHandle || oldEdge.sourceHandle,
          targetHandle: normalizedConnection.targetHandle || oldEdge.targetHandle,
        };
        
        const tempEdges = edges.map((e) => (e.id === oldEdge.id ? tempEdge : e));
        const tempDSL = xyFlowToDSL(nodes, tempEdges, dsl);
        
        // Update edge via WebSocket (delete old, create new)
        const wsClient = getWebSocketClient();
        const sourceHandle = normalizedConnection.sourceHandle?.replace(/-target$/, '');
        const targetHandle = normalizedConnection.targetHandle?.replace(/-target$/, '');
        const newSource = normalizedConnection.source || oldEdge.source;
        const newTarget = normalizedConnection.target || oldEdge.target;
        
        // Update edge on server (keep same ID, just update connection)
        wsClient.deleteEdge(oldEdge.id).then(() => {
          return wsClient.createEdge(
            oldEdge.id, // Keep the same edge ID
            newSource,
            newTarget,
            sourceHandle,
            targetHandle,
            (oldData.params || {}) as Record<string, unknown>
          );
        }).then((result) => {
          if (!result.valid && result.issues && result.issues.length > 0) {
            // Show validation errors and prevent reconnection
            const errorMessages = result.issues.map(
              (issue) => `${issue.code}: ${issue.message}`
            );
            setValidationErrors(errorMessages);
            // Restore old edge
            setEdges(edges);
          } else {
            // Clear validation errors if connection is valid
            setValidationErrors([]);
            
            // Proceed with reconnection - reconnectEdge preserves the edge ID
            const updatedEdges = reconnectEdge(oldEdge, normalizedConnection, edges);
            
            // Ensure the edge keeps its original ID and preserve all data
            const finalEdges = updatedEdges.map((edge) => {
              // Find the reconnected edge (it should have the same ID, but check both old and new)
              if (edge.id === oldEdge.id || 
                  (edge.source === normalizedConnection.source && 
                   edge.target === normalizedConnection.target)) {
                return {
                  ...edge,
                  id: oldEdge.id, // Force keep the original ID
                  type: 'polyline',
                  data: {
                    ...oldData,
                    ...edge.data,
                    points: oldPoints,
                  },
                };
              }
              return edge;
            });
            
            setEdges(finalEdges);
            
            // Update DSL
            if (dsl) {
              const newDSL = xyFlowToDSL(nodes, finalEdges, dsl);
              setDSL(newDSL);
            }
          }
        }).catch((error) => {
          console.error('Failed to reconnect edge:', error);
          // On error, allow reconnection (fail open for now)
          const updatedEdges = reconnectEdge(oldEdge, normalizedConnection, edges);
          const finalEdges = updatedEdges.map((edge) => {
            // Ensure the edge keeps its original ID
            if (edge.id === oldEdge.id || 
                (edge.source === normalizedConnection.source && 
                 edge.target === normalizedConnection.target)) {
              return {
                ...edge,
                id: oldEdge.id, // Force keep the original ID
                type: 'polyline',
                data: {
                  ...oldData,
                  ...edge.data,
                  points: oldPoints,
                },
              };
            }
            return edge;
          });
          setEdges(finalEdges);
          if (dsl) {
            const newDSL = xyFlowToDSL(nodes, finalEdges, dsl);
            setDSL(newDSL);
          }
        });
        
        return; // Wait for validation result
      }

      // reconnectEdge handles the reconnection and uses the actual handle IDs from ReactFlow
      const updatedEdges = reconnectEdge(oldEdge, normalizedConnection, edges);
      
      // Ensure the edge keeps its original ID and preserve all data
      const finalEdges = updatedEdges.map((edge) => {
        // Find the reconnected edge and ensure it keeps the original ID
        if (edge.id === oldEdge.id || 
            (edge.source === normalizedConnection.source && 
             edge.target === normalizedConnection.target)) {
          return {
            ...edge,
            id: oldEdge.id, // Force keep the original ID
            type: 'polyline', // Always keep polyline type
            data: {
              ...oldData, // Preserve all old data
              ...edge.data, // Merge with new data from reconnectEdge
              points: oldPoints, // Preserve all existing points (even if empty)
            },
          };
        }
        return edge;
      });
      
      setEdges(finalEdges);
      
      // Update DSL (normalization happens in xyFlowToDSL)
      if (dsl) {
        const newDSL = xyFlowToDSL(nodes, finalEdges, dsl);
        setDSL(newDSL);
      }
    },
    [nodes, edges, dsl, setEdges, setDSL, setValidationErrors]
  );
  
  const onConnectStart: OnConnectStart = useCallback(
    (event, { nodeId }) => {
      // Track which node the connection started from
      if (nodeId) {
        setConnectionStartNode(nodeId);
      }
    },
    []
  );
  
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        setConnectionStartNode(null);
        return;
      }
      
      // Determine direction based on where connection started
      // If connection started from a specific node, use that as source
      let finalSource = connection.source;
      let finalTarget = connection.target;
      let finalSourceHandle = connection.sourceHandle;
      let finalTargetHandle = connection.targetHandle;
      
      // If we tracked the start node and it doesn't match connection.source,
      // ReactFlow may have reversed the direction - swap them
      if (connectionStartNode && connectionStartNode !== connection.source) {
        // Connection was reversed by ReactFlow, swap source and target
        finalSource = connection.target;
        finalTarget = connection.source;
        finalSourceHandle = connection.targetHandle;
        finalTargetHandle = connection.sourceHandle;
      }
      
      // Ensure handles match the actual handle IDs in nodes:
      // - Source handle should be a source handle (no -target suffix)
      // - Target handle should be a target handle (with -target suffix)
      // If ReactFlow gave us a target handle for source, we need to convert it
      if (finalSourceHandle && finalSourceHandle.endsWith('-target')) {
        // Source handle has -target suffix, remove it to get the base ID
        finalSourceHandle = finalSourceHandle.replace(/-target$/, '');
      }
      
      if (finalTargetHandle && !finalTargetHandle.endsWith('-target')) {
        // Target handle doesn't have -target suffix, add it
        finalTargetHandle = `${finalTargetHandle}-target`;
      }
      
      // Create temporary edge for validation
      const tempEdge: Edge = {
        id: `edge_${Date.now()}`,
        source: finalSource,
        target: finalTarget,
        type: 'polyline', // Use polyline edge type by default
        sourceHandle: finalSourceHandle,
        targetHandle: finalTargetHandle,
        markerEnd: {
          type: 'arrowclosed',
        },
        data: {
          params: {},
          points: [], // Initialize with empty points array
        },
      };
      
      // Create edge via WebSocket (backend validates and stores)
      const wsClient = getWebSocketClient();
      const sourceHandle = finalSourceHandle?.replace(/-target$/, '');
      const targetHandle = finalTargetHandle?.replace(/-target$/, '');
      
      wsClient.createEdge(
        tempEdge.id,
        finalSource,
        finalTarget,
        sourceHandle,
        targetHandle,
        {}
      ).then((result) => {
        if (!result.valid && result.issues && result.issues.length > 0) {
          // Show validation errors and prevent edge creation
          const errorMessages = result.issues.map(
            (issue) => `${issue.code}: ${issue.message}`
          );
          setValidationErrors(errorMessages);
          setConnectionStartNode(null);
        } else {
          // Clear validation errors if connection is valid
          setValidationErrors([]);
          
          // Connection is valid, create the edge locally
          const newEdges = [...edges, tempEdge];
          setEdges(newEdges);
          
          // Clear connection start tracking
          setConnectionStartNode(null);
          
          // Update DSL
          if (dsl) {
            const newDSL = xyFlowToDSL(nodes, newEdges, dsl);
            setDSL(newDSL);
          }
        }
      }).catch((error) => {
        console.error('Failed to create edge:', error);
        // On error, allow connection (fail open for now)
        const newEdges = [...edges, tempEdge];
        setEdges(newEdges);
        setConnectionStartNode(null);
        if (dsl) {
          const newDSL = xyFlowToDSL(nodes, newEdges, dsl);
          setDSL(newDSL);
        }
      });
    },
    [nodes, edges, dsl, setEdges, setDSL, setValidationErrors, connectionStartNode]
  );
  
  // Ensure all edges have polyline type
  useEffect(() => {
    const edgesToUpdate = edges.filter(
      (edge) => !edge.type || edge.type !== 'polyline'
    );
    
    if (edgesToUpdate.length > 0) {
      const updatedEdges = edges.map((edge) => {
        if (!edge.type || edge.type !== 'polyline') {
          return {
            ...edge,
            type: 'polyline',
            data: {
              ...edge.data,
              points: edge.data?.points || [],
            },
          };
        }
        return edge;
      });
      
      // Only update if there are actual changes
      const hasChanges = updatedEdges.some((edge, idx) => 
        edge.type !== edges[idx]?.type || 
        JSON.stringify(edge.data?.points) !== JSON.stringify(edges[idx]?.data?.points)
      );
      
      if (hasChanges) {
        setEdges(updatedEdges, false); // Don't save history for this migration
      }
    }
  }, [edges.length]); // Only run when number of edges changes
  
  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't delete if focus is in an input field
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)
      );
      
      if (isInputFocused) {
        return; // Let input handle its own keys
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        if (selectedNodeId) {
          // Delete node via WebSocket
          const wsClient = getWebSocketClient();
          wsClient.deleteNode(selectedNodeId).then(() => {
            const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
            setNodes(newNodes);
            setSelectedNodeId(null);
            
            // Remove connected edges (backend will handle this, but update UI)
            const edgesToDelete = edges.filter(
              (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
            );
            const newEdges = edges.filter(
              (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
            );
            
            // Delete edges from backend
            Promise.all(edgesToDelete.map((edge) => wsClient.deleteEdge(edge.id)))
              .then(() => {
                setEdges(newEdges);
                
                // Update DSL
                if (dsl) {
                  const newDSL = xyFlowToDSL(newNodes, newEdges, dsl);
                  setDSL(newDSL);
                }
              })
              .catch((error) => {
                console.error('Failed to delete edges:', error);
                // Update UI anyway (fail open)
                setEdges(newEdges);
                if (dsl) {
                  const newDSL = xyFlowToDSL(newNodes, newEdges, dsl);
                  setDSL(newDSL);
                }
              });
          }).catch((error) => {
            console.error('Failed to delete node:', error);
            // Update UI anyway (fail open)
            const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
            setNodes(newNodes);
            setSelectedNodeId(null);
            
            const newEdges = edges.filter(
              (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
            );
            setEdges(newEdges);
            
            if (dsl) {
              const newDSL = xyFlowToDSL(newNodes, newEdges, dsl);
              setDSL(newDSL);
            }
          });
        } else if (selectedEdgeId) {
          // Delete edge via WebSocket
          const wsClient = getWebSocketClient();
          wsClient.deleteEdge(selectedEdgeId).then(() => {
            const newEdges = edges.filter((e) => e.id !== selectedEdgeId);
            setEdges(newEdges);
            setSelectedEdgeId(null);
            
            // Update DSL
            if (dsl) {
              const newDSL = xyFlowToDSL(nodes, newEdges, dsl);
              setDSL(newDSL);
            }
          }).catch((error) => {
            console.error('Failed to delete edge:', error);
            // Update UI anyway (fail open)
            const newEdges = edges.filter((e) => e.id !== selectedEdgeId);
            setEdges(newEdges);
            setSelectedEdgeId(null);
            
            if (dsl) {
              const newDSL = xyFlowToDSL(nodes, newEdges, dsl);
              setDSL(newDSL);
            }
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodeId,
    selectedEdgeId,
    nodes,
    edges,
    dsl,
    setNodes,
    setEdges,
    setDSL,
    setSelectedNodeId,
    setSelectedEdgeId,
  ]);
  
  const { edgeCreationMode, setEdgeCreationMode, setEdgeCreationSourceNodeId } = useEditorStore();
  
  // Disable edge creation mode when clicking on pane
  const onPaneClick = useCallback(() => {
    if (edgeCreationMode) {
      setEdgeCreationMode(false);
      setEdgeCreationSourceNodeId(null);
    }
  }, [edgeCreationMode, setEdgeCreationMode, setEdgeCreationSourceNodeId]);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onConnectStart={onConnectStart}
      onReconnect={onReconnect}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionLineComponent={ConnectionLine}
      defaultEdgeOptions={{
        type: 'polyline',
        markerEnd: {
          type: 'arrowclosed',
        },
        data: {
          points: [],
        },
      }}
      fitView
      deleteKeyCode={null} // We handle delete manually
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}

function App() {
  const { canUndo, canRedo, undo, redo } = useEditorStore();
  
  return (
    <div className="app">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Top toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderBottom: '1px solid #ddd' }}>
          <button
            onClick={undo}
            disabled={!canUndo()}
            style={{
              padding: '6px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: canUndo() ? 'pointer' : 'not-allowed',
              opacity: canUndo() ? 1 : 0.5,
            }}
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            style={{
              padding: '6px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: canRedo() ? 'pointer' : 'not-allowed',
              opacity: canRedo() ? 1 : 0.5,
            }}
          >
            Redo
          </button>
        </div>
        
        {/* Import/Export */}
        <ImportExport />
        
        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Node Palette */}
          <NodePalette />
          
          {/* Center: Canvas */}
          <div style={{ flex: 1, position: 'relative' }}>
            <ReactFlowProvider>
              <Canvas />
            </ReactFlowProvider>
          </div>
          
          {/* Right: Inspector / DSL Viewer */}
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
