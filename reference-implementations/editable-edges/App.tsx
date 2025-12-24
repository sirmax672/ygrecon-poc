import React, { useCallback, useState } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  Position,
  ConnectionMode,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import PositionableEdge from "./PositionableEdge";

const EdgesFlow = () => {
  const initialNodes: Node[] = [
    // Smooth step
    {
      id: "SmoothStepA",
      type: "input",
      data: { label: "SmoothStepA" },
      position: { x: 125, y: 0 },
    },
    {
      id: "SmoothStepB",
      type: "output",
      data: { label: "SmoothStepB" },
      position: { x: 125, y: 200 },
    },
    // bezier
    {
      id: "BezierA",
      type: "input",
      data: { label: "BezierA" },
      position: { x: 325, y: 0 },
    },
    {
      id: "BezierB",
      type: "output",
      data: { label: "BezierB" },
      position: { x: 325, y: 200 },
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: "SmoothStepEdge",
      source: "SmoothStepA",
      target: "SmoothStepB",
      type: "positionableedge",
      data: {
        type: "smoothstep",
        positionHandlers: [
          {
            x: 150.0,
            y: 100.0,
          },
          {
            x: 250.0,
            y: 150.0,
          },
        ],
      },
    },
    {
      id: "BezierEdge",
      source: "BezierA",
      target: "BezierB",
      type: "positionableedge",
      data: {
        type: "default",
        positionHandlers: [
          {
            x: 350.0,
            y: 100.0,
          },
          {
            x: 450.0,
            y: 150.0,
          },
        ],
      },
    },
  ];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const edgeTypes = {
    positionableedge: PositionableEdge,
  };

  const nodeTypes = {};

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      snapToGrid={false}
      edgeTypes={edgeTypes}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="top-right"
      connectionMode={ConnectionMode.Loose}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default EdgesFlow;
