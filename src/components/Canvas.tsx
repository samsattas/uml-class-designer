import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUmlStore } from '../store/useUmlStore';
import { ClassBox } from './ClassBox';
import { Connection } from './Connection';
import { ClassData, Connection as ConnectionType } from '../types';

interface CanvasProps {
  onEditConnection: (conn: ConnectionType, x: number, y: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ onEditConnection }) => {
  const {
    classes,
    connections,
    zoom,
    panX,
    panY,
    setZoom,
    setPan,
    addConnection,
    selectedConn,
    setSelectedConn,
    deleteConnection
  } = useUmlStore();
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  
  // Connection drawing state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSource, setConnectSource] = useState<{ cls: ClassData, pos: 't' | 'b' | 'l' | 'r' } | null>(null);
  const [previewLine, setPreviewLine] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  const updateTransform = useCallback(() => {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    }
  }, [panX, panY, zoom]);

  useEffect(() => {
    updateTransform();
  }, [updateTransform]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConn) {
        const target = e.target as HTMLElement;
        if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        deleteConnection(selectedConn.from, selectedConn.to);
        setSelectedConn(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConn, deleteConnection, setSelectedConn]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === viewportRef.current || (e.target as HTMLElement).id === 'canvas' || (e.target as HTMLElement).id === 'svg-layer') {
      setIsPanning(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
      setSelectedConn(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(panX + (e.clientX - lastMouse.x), panY + (e.clientY - lastMouse.y));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }

    if (isConnecting && connectSource && previewLine) {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = (e.clientX - rect.left - panX) / zoom;
        const my = (e.clientY - rect.top - panY) / zoom;
        setPreviewLine({ ...previewLine, x2: mx, y2: my });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);
    
    if (isConnecting && connectSource) {
      const targetBox = (e.target as HTMLElement).closest('.class-box');
      if (targetBox) {
        const targetId = parseInt(targetBox.id.split('-')[1]);
        if (connectSource.cls.id !== targetId) {
          addConnection(connectSource.cls.id, targetId);
        }
      }
      setIsConnecting(false);
      setConnectSource(null);
      setPreviewLine(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const oldZoom = zoom;
    const newZoom = Math.min(Math.max(zoom * (e.deltaY < 0 ? 1.05 : 0.95), 0.2), 4);
    
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect) {
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      const newPanX = mx - (mx - panX) * (newZoom / oldZoom);
      const newPanY = my - (my - panY) * (newZoom / oldZoom);
      
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    }
  };

  const handleStartConnection = (cls: ClassData, pos: 't' | 'b' | 'l' | 'r') => {
    setIsConnecting(true);
    setConnectSource({ cls, pos });
    
    const box = document.getElementById(`c-${cls.id}`);
    if (box) {
      let startX = cls.x;
      let startY = cls.y;
      
      if (pos === 't') { startX += box.offsetWidth / 2; }
      if (pos === 'b') { startX += box.offsetWidth / 2; startY += box.offsetHeight; }
      if (pos === 'l') { startY += box.offsetHeight / 2; }
      if (pos === 'r') { startX += box.offsetWidth; startY += box.offsetHeight / 2; }
      
      setPreviewLine({ x1: startX, y1: startY, x2: startX, y2: startY });
    }
  };

  return (
    <div 
      id="viewport" 
      ref={viewportRef}
      className="w-screen h-screen relative cursor-grab overflow-hidden bg-bg-canvas"
      style={{ 
        backgroundImage: 'radial-gradient(var(--dot-color) 1px, transparent 1px)', 
        backgroundSize: '24px 24px' 
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <div id="canvas" className="absolute top-0 left-0 origin-top-left w-[5000px] h-[5000px]">
        <svg id="svg-layer" className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
            </marker>
            <marker id="inheritance-arrow" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto">
              <path d="M0,0 L12,6 L0,12 Z" fill="var(--bg-canvas)" stroke="#6366f1" />
            </marker>
            <marker id="aggregation-diamond" markerWidth="16" markerHeight="10" refX="16" refY="5" orient="auto">
              <path d="M0,5 L8,0 L16,5 L8,10 Z" fill="var(--bg-canvas)" stroke="#6366f1" />
            </marker>
            <marker id="composition-diamond" markerWidth="16" markerHeight="10" refX="16" refY="5" orient="auto">
              <path d="M0,5 L8,0 L16,5 L8,10 Z" fill="#6366f1" stroke="#6366f1" />
            </marker>
          </defs>
          
          {connections.map((conn, idx) => {
            const from = classes.find(c => c.id === conn.from);
            const to = classes.find(c => c.id === conn.to);
            if (!from || !to) return null;
            return (
              <Connection 
                key={`${conn.from}-${conn.to}-${idx}`} 
                data={conn} 
                fromClass={from} 
                toClass={to} 
                onEdit={onEditConnection}
              />
            );
          })}

          {isConnecting && previewLine && (
            <line 
              x1={previewLine.x1} y1={previewLine.y1} 
              x2={previewLine.x2} y2={previewLine.y2} 
              className="preview-line stroke-accent-uml stroke-2 stroke-dash-5 opacity-60 pointer-events-none"
              style={{ strokeDasharray: '5,5' }}
            />
          )}
        </svg>

        {classes.map(cls => (
          <ClassBox 
            key={cls.id} 
            data={cls} 
            onStartConnection={handleStartConnection}
          />
        ))}
      </div>
    </div>
  );
};
