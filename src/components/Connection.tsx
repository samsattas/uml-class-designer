import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Connection as ConnectionType, ClassData, AnchorPoint } from '../types';
import { getPts, getAnchorPoint, snapToEdge, intersect } from '../utils/geometry';
import { useUmlStore } from '../store/useUmlStore';

interface ConnectionProps {
  data: ConnectionType;
  fromClass: ClassData;
  toClass: ClassData;
  onEdit: (conn: ConnectionType, x: number, y: number) => void;
}

function getBoxRect(cls: ClassData) {
  const el = document.getElementById(`c-${cls.id}`);
  return {
    x: cls.x,
    y: cls.y,
    w: el?.offsetWidth || cls.width || 240,
    h: el?.offsetHeight || cls.height || 150,
  };
}

export const Connection: React.FC<ConnectionProps> = ({ data, fromClass, toClass, onEdit }) => {
  const deleteConnection = useUmlStore(state => state.deleteConnection);
  const selectedConn = useUmlStore(state => state.selectedConn);
  const setSelectedConn = useUmlStore(state => state.setSelectedConn);
  const updateConnection = useUmlStore(state => state.updateConnection);
  const zoom = useUmlStore(state => state.zoom);
  const panX = useUmlStore(state => state.panX);
  const panY = useUmlStore(state => state.panY);

  const isSelected = selectedConn?.from === data.from && selectedConn?.to === data.to;

  const [dragging, setDragging] = useState<'from' | 'to' | null>(null);
  const [dragAnchor, setDragAnchor] = useState<AnchorPoint | null>(null);

  const screenToCanvas = useCallback((e: MouseEvent) => ({
    x: (e.clientX - panX) / zoom,
    y: (e.clientY - 56 - panY) / zoom,
  }), [panX, panY, zoom]);

  const pts = useMemo(() => {
    const r1 = getBoxRect(fromClass);
    const r2 = getBoxRect(toClass);

    const fa = dragging === 'from' && dragAnchor ? dragAnchor : data.fromAnchor;
    const ta = dragging === 'to' && dragAnchor ? dragAnchor : data.toAnchor;

    const c1 = { x: r1.x + r1.w / 2, y: r1.y + r1.h / 2 };
    const c2 = { x: r2.x + r2.w / 2, y: r2.y + r2.h / 2 };

    let p1, p2;

    if (fa) {
      p1 = getAnchorPoint(r1, fa);
    } else {
      const target = ta ? getAnchorPoint(r2, ta) : c2;
      p1 = intersect(c1, target, r1);
    }

    if (ta) {
      p2 = getAnchorPoint(r2, ta);
    } else {
      const source = fa ? getAnchorPoint(r1, fa) : c1;
      p2 = intersect(c2, source, r2);
    }

    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  }, [fromClass, toClass, data.fromAnchor, data.toAnchor, dragging, dragAnchor]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      const canvasPos = screenToCanvas(e);
      const targetClass = dragging === 'from' ? fromClass : toClass;
      const rect = getBoxRect(targetClass);
      setDragAnchor(snapToEdge(rect, canvasPos));
    };

    const handleUp = (e: MouseEvent) => {
      const canvasPos = screenToCanvas(e);
      const targetClass = dragging === 'from' ? fromClass : toClass;
      const rect = getBoxRect(targetClass);
      const anchor = snapToEdge(rect, canvasPos);

      if (dragging === 'from') {
        updateConnection(data.from, data.to, { fromAnchor: anchor });
      } else {
        updateConnection(data.from, data.to, { toAnchor: anchor });
      }

      setDragging(null);
      setDragAnchor(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, screenToCanvas, fromClass, toClass, data.from, data.to, updateConnection]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      if (confirm('Delete connection?')) {
        deleteConnection(data.from, data.to);
      }
    } else {
      setSelectedConn(data);
      onEdit(data, e.clientX, e.clientY);
    }
  };

  const handleEndpointMouseDown = (endpoint: 'from' | 'to') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(endpoint);
  };

  const midX = (pts.x1 + pts.x2) / 2;
  const midY = (pts.y1 + pts.y2) / 2;
  const angleDeg = Math.atan2(pts.y2 - pts.y1, pts.x2 - pts.x1) * 180 / Math.PI;

  const displayLabel = data.isList ? `${data.attributeName} [ ]` : data.attributeName;

  const strokeClass = isSelected ? 'stroke-[#f59e0b] stroke-[3px]' : 'stroke-accent-uml stroke-2';

  return (
    <g className="conn group">
      {/* Invisible wide hit area for easier clicking */}
      <line
        x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
        className="stroke-transparent pointer-events-auto cursor-pointer"
        strokeWidth={16}
        onClick={handleClick}
      />
      <line
        x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
        className={`connection-line fill-none pointer-events-none group-hover:stroke-[4px] transition-all ${strokeClass}`}
      />

      {/* Inline arrowhead at end */}
      {(data.type === 'association' || data.type === 'aggregation' || data.type === 'composition') && (
        <polygon
          points="0,0 -11,-5 -11,5"
          transform={`translate(${pts.x2},${pts.y2}) rotate(${angleDeg})`}
          className={isSelected ? 'fill-[#f59e0b]' : 'fill-accent-uml'}
        />
      )}

      {/* Inheritance open triangle at end */}
      {data.type === 'inheritance' && (
        <polygon
          points="0,0 -14,-7 -14,7"
          transform={`translate(${pts.x2},${pts.y2}) rotate(${angleDeg})`}
          style={{ fill: 'var(--bg-canvas)' }}
          className={isSelected ? 'stroke-[#f59e0b]' : 'stroke-accent-uml'}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}

      {/* Aggregation open diamond at start */}
      {data.type === 'aggregation' && (
        <polygon
          points="0,0 8,-5 16,0 8,5"
          transform={`translate(${pts.x1},${pts.y1}) rotate(${angleDeg})`}
          style={{ fill: 'var(--bg-canvas)' }}
          className={isSelected ? 'stroke-[#f59e0b]' : 'stroke-accent-uml'}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}

      {/* Composition filled diamond at start */}
      {data.type === 'composition' && (
        <polygon
          points="0,0 8,-5 16,0 8,5"
          transform={`translate(${pts.x1},${pts.y1}) rotate(${angleDeg})`}
          className={isSelected ? 'fill-[#f59e0b] stroke-[#f59e0b]' : 'fill-accent-uml stroke-accent-uml'}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}

      {data.attributeName && (
        <text
          x={midX} y={midY}
          className="connection-label text-[12px] fill-text-primary font-medium select-none pointer-events-auto cursor-pointer"
          textAnchor="middle"
          dominantBaseline="middle"
          stroke="var(--bg-canvas)"
          strokeWidth={6}
          paintOrder="stroke fill"
          onClick={handleClick}
        >
          {displayLabel}
        </text>
      )}

      {/* Draggable endpoint handles — visible when selected */}
      {isSelected && (
        <>
          <circle
            cx={pts.x1} cy={pts.y1} r={7}
            className="fill-accent-uml stroke-bg-card pointer-events-auto cursor-grab"
            strokeWidth={2}
            onMouseDown={handleEndpointMouseDown('from')}
          />
          <circle
            cx={pts.x2} cy={pts.y2} r={7}
            className="fill-accent-uml stroke-bg-card pointer-events-auto cursor-grab"
            strokeWidth={2}
            onMouseDown={handleEndpointMouseDown('to')}
          />
        </>
      )}
    </g>
  );
};
