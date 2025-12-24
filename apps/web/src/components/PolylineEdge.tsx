import React from 'react';
import {
  EdgeLabelRenderer,
  EdgeProps,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react';
import { ClickableBaseEdge } from './ClickableBaseEdge';
import './PolylineEdge.css';

interface Point {
  x: number;
  y: number;
  active?: number;
}

/**
 * Polyline edge component that supports editable bend points.
 * Renders straight segments through control points: source -> p1 -> ... -> target
 */
export const PolylineEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const reactFlowInstance = useReactFlow();
  const points: Point[] = (data?.points as Point[]) || [];
  const edgeSegmentsCount = points.length + 1;
  const edgeSegmentsArray: Array<{ edgePath: string; labelX: number; labelY: number }> = [];

  // Calculate segments: source -> p1 -> ... -> target
  for (let i = 0; i < edgeSegmentsCount; i++) {
    let segmentSourceX: number;
    let segmentSourceY: number;
    let segmentTargetX: number;
    let segmentTargetY: number;

    if (i === 0) {
      segmentSourceX = sourceX;
      segmentSourceY = sourceY;
    } else {
      const handler = points[i - 1];
      segmentSourceX = handler.x;
      segmentSourceY = handler.y;
    }

    if (i === edgeSegmentsCount - 1) {
      segmentTargetX = targetX;
      segmentTargetY = targetY;
    } else {
      const handler = points[i];
      segmentTargetX = handler.x;
      segmentTargetY = handler.y;
    }

    const [edgePath, labelX, labelY] = getStraightPath({
      sourceX: segmentSourceX,
      sourceY: segmentSourceY,
      targetX: segmentTargetX,
      targetY: segmentTargetY,
    });
    edgeSegmentsArray.push({ edgePath, labelX, labelY });
  }

  const updateEdgePoints = (updater: (points: Point[]) => Point[]) => {
    reactFlowInstance.setEdges((edges) => {
      const edgeIndex = edges.findIndex((edge) => edge.id === id);
      if (edgeIndex === -1) return edges;

      const currentPoints = (edges[edgeIndex].data?.points as Point[]) || [];
      const newPoints = updater(currentPoints);
      
      // Always keep polyline type, even with empty points
      edges[edgeIndex] = {
        ...edges[edgeIndex],
        type: 'polyline',
        data: {
          ...edges[edgeIndex].data,
          points: newPoints,
        },
      };
      return edges;
    });
  };

  return (
    <>
      {edgeSegmentsArray.map(({ edgePath, labelX, labelY }, index) => (
        <ClickableBaseEdge
          key={`edge${id}_segment${index}`}
          path={edgePath}
          markerEnd={index === edgeSegmentsArray.length - 1 ? markerEnd : undefined}
          style={style}
          onDoubleClick={(event) => {
            // Double-click to add a new control point
            event.preventDefault();
            event.stopPropagation();
            const position = reactFlowInstance.screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            });

            updateEdgePoints((currentPoints) => {
              const newPoint: Point = { x: position.x, y: position.y };
              const newPoints = [...currentPoints];
              newPoints.splice(index, 0, newPoint);
              return newPoints;
            });
          }}
          onClick={undefined}
        />
      ))}
      
      {/* Render control points only when edge is selected */}
      {selected && points.map((point, handlerIndex) => (
        <EdgeLabelRenderer key={`edge${id}_handler${handlerIndex}`}>
          <div
            className="nopan positionHandlerContainer"
            style={{
              transform: `translate(-50%, -50%) translate(${point.x}px,${point.y}px)`,
            }}
          >
            <div
              className={`positionHandlerEventContainer ${point.active !== undefined && point.active !== -1 ? 'active' : ''}`}
              data-active={point.active ?? -1}
              onMouseMove={(event) => {
                const activeEdge = parseInt((event.currentTarget as HTMLElement).dataset.active ?? '-1');
                if (activeEdge === -1) {
                  return;
                }
                const position = reactFlowInstance.screenToFlowPosition({
                  x: event.clientX,
                  y: event.clientY,
                });
                
                updateEdgePoints((currentPoints) => {
                  const newPoints = [...currentPoints];
                  newPoints[handlerIndex] = {
                    x: position.x,
                    y: position.y,
                    active: activeEdge,
                  };
                  return newPoints;
                });
              }}
              onMouseUp={() => {
                reactFlowInstance.setEdges((edges) => {
                  return edges.map((edge) => {
                    const points = (edge.data?.points as Point[]) || [];
                    if (points.length === 0) return edge;
                    
                    const updatedPoints = points.map((point) => ({
                      ...point,
                      active: -1,
                    }));
                    
                    return {
                      ...edge,
                      data: {
                        ...edge.data,
                        points: updatedPoints,
                      },
                    };
                  });
                });
              }}
            >
              <button
                className="positionHandler"
                data-active={point.active ?? -1}
                onMouseDown={() => {
                  updateEdgePoints((currentPoints) => {
                    const newPoints = [...currentPoints];
                    const edgeIndex = reactFlowInstance.getEdges().findIndex((e) => e.id === id);
                    newPoints[handlerIndex] = {
                      ...newPoints[handlerIndex],
                      active: edgeIndex,
                    };
                    return newPoints;
                  });
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  updateEdgePoints((currentPoints) => {
                    const newPoints = [...currentPoints];
                    newPoints.splice(handlerIndex, 1);
                    return newPoints;
                  });
                }}
              />
            </div>
          </div>
        </EdgeLabelRenderer>
      ))}
    </>
  );
};

PolylineEdge.displayName = 'PolylineEdge';

