import React from 'react';

interface ClickableBaseEdgeProps {
  id?: string;
  path: string;
  style?: React.CSSProperties;
  markerEnd?: string;
  markerStart?: string;
  interactionWidth?: number;
  onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<SVGPathElement>) => void;
}

/**
 * Base edge component with clickable interaction area.
 * Provides a wider invisible path for easier clicking on edges.
 */
export const ClickableBaseEdge: React.FC<ClickableBaseEdgeProps> = ({
  id,
  path,
  style,
  markerEnd,
  markerStart,
  interactionWidth = 20,
  onClick,
  onDoubleClick,
}) => {
  return (
    <>
      <path
        id={id}
        style={style}
        d={path}
        fill="none"
        className="react-flow__edge-path"
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {interactionWidth && (onClick || onDoubleClick) && (
        <path
          d={path}
          fill="none"
          strokeOpacity={0}
          strokeWidth={interactionWidth}
          className="react-flow__edge-interaction"
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        />
      )}
    </>
  );
};

ClickableBaseEdge.displayName = 'ClickableBaseEdge';

