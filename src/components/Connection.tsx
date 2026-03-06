import React, { useMemo } from 'react';
import { Connection as ConnectionType, ClassData } from '../types';
import { getPts } from '../utils/geometry';
import { useUmlStore } from '../store/useUmlStore';

interface ConnectionProps {
  data: ConnectionType;
  fromClass: ClassData;
  toClass: ClassData;
  onEdit: (conn: ConnectionType, x: number, y: number) => void;
}

export const Connection: React.FC<ConnectionProps> = ({ data, fromClass, toClass, onEdit }) => {
  const deleteConnection = useUmlStore(state => state.deleteConnection);
  
  // We need the actual dimensions of the boxes to calculate intersection points
  // Since we don't have them easily, we'll estimate them or use a fixed size
  // In a real app, we'd use a ResizeObserver to track dimensions
  const pts = useMemo(() => {
    const fE = document.getElementById(`c-${fromClass.id}`);
    const tE = document.getElementById(`c-${toClass.id}`);
    
    const r1 = { 
      x: fromClass.x, 
      y: fromClass.y, 
      w: fE?.offsetWidth || 240, 
      h: fE?.offsetHeight || 150 
    };
    const r2 = { 
      x: toClass.x, 
      y: toClass.y, 
      w: tE?.offsetWidth || 240, 
      h: tE?.offsetHeight || 150 
    };
    
    return getPts(r1, r2);
  }, [fromClass.x, fromClass.y, toClass.x, toClass.y, fromClass.id, toClass.id]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      if (confirm('Delete connection?')) {
        deleteConnection(data.from, data.to);
      }
    } else {
      onEdit(data, e.clientX, e.clientY);
    }
  };

  const midX = (pts.x1 + pts.x2) / 2;
  const midY = (pts.y1 + pts.y2) / 2;

  const displayLabel = data.isList ? `${data.attributeName} [ ]` : data.attributeName;

  return (
    <g className="conn group">
      <line 
        x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
        className="connection-line stroke-accent-uml stroke-2 fill-none pointer-events-auto cursor-pointer group-hover:stroke-[4px] transition-all"
        markerEnd={
          data.type === 'association' ? 'url(#arrowhead)' : 
          data.type === 'inheritance' ? 'url(#inheritance-arrow)' : 
          (data.type === 'aggregation' || data.type === 'composition') ? 'url(#arrowhead)' : undefined
        }
        markerStart={
          data.type === 'aggregation' ? 'url(#aggregation-diamond)' : 
          data.type === 'composition' ? 'url(#composition-diamond)' : undefined
        }
        onClick={handleClick}
      />
      
      {data.attributeName && (
        <g className="connection-label-group">
          <text 
            x={midX} y={midY}
            className="connection-label text-[12px] fill-text-primary font-medium text-center select-none pointer-events-auto"
            textAnchor="middle"
            dominantBaseline="middle"
            onDoubleClick={(e) => onEdit(data, e.clientX, e.clientY)}
          >
            {displayLabel}
          </text>
        </g>
      )}
    </g>
  );
};
