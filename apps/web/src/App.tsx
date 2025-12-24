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
import { useEffect, useCallback, useState } from 'react';
import { useEditorStore } from './store/editorStore';
import { CustomNode } from './components/CustomNode';
import { NodePalette } from './components/NodePalette';
import { Inspector } from './components/Inspector';
import { ImportExport } from './components/ImportExport';
import { xyFlowToDSL } from './utils/dslConverter';
import { validateConnections, type ValidationIssue } from '@ygrecon/core';
import './App.css';

const nodeTypes = {
  custom: CustomNode,
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
  
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const newNodes = applyNodeChanges(changes, nodes);
      setNodes(newNodes);
      
      // Handle selection
      for (const change of changes) {
        if (change.type === 'select') {
          if (change.selected) {
            setSelectedNodeId(change.id);
          } else if (selectedNodeId === change.id) {
            setSelectedNodeId(null);
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
      // reconnectEdge handles the reconnection and uses the actual handle IDs from ReactFlow
      const updatedEdges = reconnectEdge(oldEdge, newConnection, edges);
      setEdges(updatedEdges);
      
      // Update DSL (normalization happens in xyFlowToDSL)
      if (dsl) {
        const newDSL = xyFlowToDSL(nodes, updatedEdges, dsl);
        setDSL(newDSL);
      }
    },
    [nodes, edges, dsl, setEdges, setDSL]
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
        sourceHandle: finalSourceHandle,
        targetHandle: finalTargetHandle,
        markerEnd: {
          type: 'arrowclosed',
        },
        data: {
          params: {},
        },
      };
      
      // Validate connection before creating it
      if (dsl) {
        const tempEdges = [...edges, tempEdge];
        const tempDSL = xyFlowToDSL(nodes, tempEdges, dsl);
        const issues = validateConnections(tempDSL);
        
        // Filter only connection-related issues for this specific edge
        const connectionIssues = issues.filter(
          (issue: ValidationIssue) =>
            issue.edgeId === tempEdge.id &&
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
          setConnectionStartNode(null);
          return;
        }
        
        // Clear validation errors if connection is valid
        setValidationErrors([]);
      }
      
      // Connection is valid, create the edge
      const newEdges = [...edges, tempEdge];
      setEdges(newEdges);
      
      // Clear connection start tracking
      setConnectionStartNode(null);
      
      // Update DSL (normalization happens in xyFlowToDSL)
      if (dsl) {
        const newDSL = xyFlowToDSL(nodes, newEdges, dsl);
        setDSL(newDSL);
      }
    },
    [nodes, edges, dsl, setEdges, setDSL, setValidationErrors, connectionStartNode]
  );
  
  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        if (selectedNodeId) {
          const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
          setNodes(newNodes);
          setSelectedNodeId(null);
          
          // Remove connected edges
          const newEdges = edges.filter(
            (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
          );
          setEdges(newEdges);
          
          // Update DSL
          if (dsl) {
            const newDSL = xyFlowToDSL(newNodes, newEdges, dsl);
            setDSL(newDSL);
          }
        } else if (selectedEdgeId) {
          const newEdges = edges.filter((e) => e.id !== selectedEdgeId);
          setEdges(newEdges);
          setSelectedEdgeId(null);
          
          // Update DSL
          if (dsl) {
            const newDSL = xyFlowToDSL(nodes, newEdges, dsl);
            setDSL(newDSL);
          }
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
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onConnectStart={onConnectStart}
      onReconnect={onReconnect}
      nodeTypes={nodeTypes}
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
          
          {/* Right: Inspector */}
          <Inspector />
        </div>
      </div>
    </div>
  );
}

export default App;
