import React from 'react';
import {
  EdgeLabelRenderer,
  EdgeProps,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react';
import { ClickableBaseEdge } from './ClickableBaseEdge';
import { getWebSocketClient } from '../services/websocket';
import './PolylineEdge.css';

interface Point {
  x: number;
  y: number;
  active?: number;
}

/**
 * Calculate point on polyline at given percentage (0-1) along the path
 */
function getPointOnPolyline(
  segments: Array<{ startX: number; startY: number; endX: number; endY: number; length: number }>,
  percentage: number
): { x: number; y: number } {
  if (segments.length === 0) {
    return { x: 0, y: 0 };
  }
  
  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
  const targetDistance = totalLength * percentage;
  
  let accumulatedLength = 0;
  for (const segment of segments) {
    if (accumulatedLength + segment.length >= targetDistance) {
      // Point is on this segment
      const segmentProgress = (targetDistance - accumulatedLength) / segment.length;
      return {
        x: segment.startX + (segment.endX - segment.startX) * segmentProgress,
        y: segment.startY + (segment.endY - segment.startY) * segmentProgress,
      };
    }
    accumulatedLength += segment.length;
  }
  
  // Return last point if percentage is >= 1
  const lastSegment = segments[segments.length - 1];
  return { x: lastSegment.endX, y: lastSegment.endY };
}

/**
 * Calculate distance between two points
 */
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
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
  const params = (data?.params as Record<string, unknown>) || {};
  const label = (params.label as string) || '';
  const formula = (params.formula as string) || '';
  const formulaPosition = (params.formulaPosition as number) ?? 0.5; // Default to middle (0-1)
  const edgeSegmentsCount = points.length + 1;
  const edgeSegmentsArray: Array<{ edgePath: string; labelX: number; labelY: number }> = [];
  const segments: Array<{ startX: number; startY: number; endX: number; endY: number; length: number }> = [];

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
    
    // Store segment info for formula positioning
    const length = getDistance(segmentSourceX, segmentSourceY, segmentTargetX, segmentTargetY);
    segments.push({
      startX: segmentSourceX,
      startY: segmentSourceY,
      endX: segmentTargetX,
      endY: segmentTargetY,
      length,
    });
  }
  
  // Calculate label/formula block position on the edge
  // Show block if either label or formula exists
  const showLabelFormulaBlock = label || formula;
  const blockPoint = showLabelFormulaBlock ? getPointOnPolyline(segments, formulaPosition) : null;

  const updateEdgeData = (updater: (currentData: Record<string, unknown>) => Record<string, unknown>) => {
    reactFlowInstance.setEdges((edges) => {
      const edgeIndex = edges.findIndex((edge) => edge.id === id);
      if (edgeIndex === -1) return edges;

      const currentData = edges[edgeIndex].data || {};
      const newData = updater(currentData as Record<string, unknown>);
      edges[edgeIndex] = {
        ...edges[edgeIndex],
        type: 'polyline',
        data: newData,
      };
      
      // Sync edge params (including points) to server (only if WebSocket is connected)
      try {
        const wsClient = getWebSocketClient();
        if (wsClient && wsClient.getSessionId()) {
          // Normalize handles - remove -target suffix for storage
          const normalizeHandle = (handle: string | null | undefined): string | undefined => {
            if (!handle) return undefined;
            return handle.replace(/-target$/, '');
          };
          
          const params: Record<string, unknown> = {
            ...edges[edgeIndex].data?.params,
            points: newData.points,
            sourceHandle: normalizeHandle(edges[edgeIndex].sourceHandle),
            targetHandle: normalizeHandle(edges[edgeIndex].targetHandle),
          };
          
          wsClient.updateEdge(id, params).catch((error) => {
            console.error('Failed to update edge on server:', error);
          });
        }
      } catch (error) {
        // WebSocket not available, continue without syncing
        console.warn('WebSocket not available for edge update:', error);
      }
      
      return edges;
    });
  };

  const updateEdgePoints = (updater: (points: Point[]) => Point[]) => {
    updateEdgeData((currentData) => {
      const currentPoints = (currentData.points as Point[]) || [];
      const newPoints = updater(currentPoints);
      return {
        ...currentData,
        points: newPoints,
      };
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
      
      {/* Render label/formula block - label above formula block, centered */}
      {/* Formula block is positioned exactly on the edge, label is above it */}
      {showLabelFormulaBlock && blockPoint && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${blockPoint.x}px,${blockPoint.y}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pointerEvents: 'all',
            }}
          >
            {/* Label above formula block */}
            {label && (
              <div
                className="edge-label"
                style={{
                  fontSize: '11px',
                  color: '#666',
                  marginBottom: formula ? '4px' : '0',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            )}
            
            {/* Formula block - positioned exactly on edge (centered at blockPoint) */}
            {formula && (
              <div
                className="edge-formula"
                style={{
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #007bff',
                  cursor: 'grab',
                  userSelect: 'none',
                  boxShadow: selected ? '0 0 4px rgba(0, 123, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.2)',
                }}
                onMouseDown={(event) => {
                  
                  event.preventDefault();
                  event.stopPropagation();
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const flowPosition = reactFlowInstance.screenToFlowPosition({
                      x: moveEvent.clientX,
                      y: moveEvent.clientY,
                    });
                    
                    // Find closest point on polyline
                    let minDistance = Infinity;
                    let closestPercentage = 0.5;
                    
                    // Sample points along the polyline to find closest
                    const samples = 100;
                    for (let i = 0; i <= samples; i++) {
                      const percentage = i / samples;
                      const pointOnEdge = getPointOnPolyline(segments, percentage);
                      const distance = getDistance(
                        flowPosition.x,
                        flowPosition.y,
                        pointOnEdge.x,
                        pointOnEdge.y
                      );
                      
                      if (distance < minDistance) {
                        minDistance = distance;
                        closestPercentage = percentage;
                      }
                    }
                    
                    // Update formula position
                    updateEdgeData((currentData) => ({
                      ...currentData,
                      params: {
                        ...(currentData.params as Record<string, unknown> || {}),
                        formulaPosition: closestPercentage,
                      },
                    }));
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                <div style={{ fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
                  {formula}
                </div>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

PolylineEdge.displayName = 'PolylineEdge';

