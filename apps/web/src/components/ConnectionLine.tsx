import React from 'react';
import { getStraightPath, type ConnectionLineComponentProps } from '@xyflow/react';

/**
 * Custom connection line component for polyline edges.
 * Renders a straight line preview when dragging a new connection.
 */
export const ConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
}) => {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#b1b1b7"
        strokeWidth={1.5}
        className="react-flow__connection-line"
        d={edgePath}
      />
      <path
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__connection-line-interaction"
        d={edgePath}
      />
    </g>
  );
};

ConnectionLine.displayName = 'ConnectionLine';

