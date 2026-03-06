import React, { useRef } from 'react';
import { useUmlStore } from '../store/useUmlStore';
import { ClassData } from '../types';
import { Icons } from './Icons';
import { clsx } from 'clsx';

interface ClassBoxProps {
  data: ClassData;
  onStartConnection: (cls: ClassData, pos: 't' | 'b' | 'l' | 'r') => void;
}

export const ClassBox: React.FC<ClassBoxProps> = ({ data, onStartConnection }) => {
  const { 
    updateClass, 
    deleteClass, 
    addAttribute, 
    updateAttribute, 
    deleteAttribute,
    addMethod,
    updateMethod,
    deleteMethod,
    zoom,
    classes
  } = useUmlStore();
  
  const boxRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      const startX = e.clientX;
      const startY = e.clientY;
      const initialX = data.x;
      const initialY = data.y;

      const onMouseMove = (moveEvent: MouseEvent) => {
        updateClass(data.id, {
          x: initialX + (moveEvent.clientX - startX) / zoom,
          y: initialY + (moveEvent.clientY - startY) / zoom
        });
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      e.stopPropagation();
    }
  };

  const isClassType = (type: string) => classes.some(c => c.name === type);

  return (
    <div 
      id={`c-${data.id}`}
      className="class-box absolute bg-bg-card border border-border-uml min-w-[240px] rounded-xl shadow-md flex flex-col select-none z-10 overflow-hidden group"
      style={{ left: data.x, top: data.y }}
    >
      {/* Header */}
      <div className="class-header bg-header-class text-white h-12 px-2 flex items-center justify-between font-semibold relative">
        <div className="flex items-center">
          <span className="drag-handle cursor-grab active:cursor-grabbing text-white/70 p-2 hover:bg-white/10 rounded-md transition-colors" onMouseDown={handleDrag}>
            <Icons.Grip size={16} />
          </span>
        </div>
        <span 
          className="editable flex-grow text-center outline-none focus:bg-white/10 px-2 py-1 rounded mx-2 truncate"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateClass(data.id, { name: e.target.innerText.trim() })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).blur()}
        >
          {data.name}
        </span>
        <div className="flex items-center">
          <button 
            onClick={() => confirm('Delete class?') && deleteClass(data.id)}
            className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            <Icons.X size={18} />
          </button>
        </div>
      </div>

      {/* Anchor Points */}
      {(['t', 'b', 'l', 'r'] as const).map(pos => (
        <div 
          key={pos}
          className={clsx(
            "anchor absolute w-3 h-3 bg-accent-uml rounded-full hidden group-hover:block z-20 cursor-crosshair border-2 border-bg-card",
            pos === 't' && "top-[-6px] left-1/2 -translate-x-1/2",
            pos === 'b' && "bottom-[-6px] left-1/2 -translate-x-1/2",
            pos === 'l' && "left-[-6px] top-1/2 -translate-y-1/2",
            pos === 'r' && "right-[-6px] top-1/2 -translate-y-1/2"
          )}
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnection(data, pos);
          }}
        />
      ))}

      {/* Attributes Section */}
      <div className="class-section py-2 border-t border-border-uml min-h-[32px]">
        {data.attributes.map((attr) => (
          <div key={attr.id} className="row px-4 py-1.5 text-[13px] flex justify-between items-center relative hover:bg-accent-uml/5 group/row">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-text-secondary">-</span>
              <span 
                className="editable outline-none focus:bg-accent-uml/10 px-1 rounded truncate"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateAttribute(data.id, attr.id, { name: e.target.innerText.trim() })}
              >
                {attr.name}
              </span>
              <span className="text-text-secondary">:</span>
              <span 
                className={clsx(
                  "editable outline-none focus:bg-accent-uml/10 px-1 rounded truncate",
                  isClassType(attr.type) && "text-accent-uml font-semibold"
                )}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateAttribute(data.id, attr.id, { type: e.target.innerText.trim() })}
              >
                {attr.type}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className={clsx(
                  "list-toggle cursor-pointer text-sm transition-opacity p-1 hover:bg-accent-uml/10 rounded",
                  attr.isList ? "opacity-100 text-accent-uml" : "opacity-40"
                )}
                onClick={() => updateAttribute(data.id, attr.id, { isList: !attr.isList })}
                title="Toggle List/Collection"
              >
                [ ]
              </button>
              <button 
                className="delete-btn hidden group-hover/row:flex items-center justify-center text-red-500 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                onClick={() => deleteAttribute(data.id, attr.id)}
              >
                <Icons.X size={14} />
              </button>
            </div>
          </div>
        ))}
        <button 
          onClick={() => addAttribute(data.id)}
          className="add-row-btn w-full p-2 text-[12px] text-text-secondary hover:text-accent-uml font-medium transition-colors flex items-center justify-center gap-1"
        >
          <Icons.Plus size={12} /> Add Attribute
        </button>
      </div>

      {/* Methods Section */}
      <div className="class-section py-2 border-t border-border-uml min-h-[32px]">
        {data.methods.map((method) => (
          <div key={method.id} className="row px-4 py-1.5 text-[13px] flex justify-between items-center relative hover:bg-accent-uml/5 group/row">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-text-secondary">+</span>
              <span 
                className="editable outline-none focus:bg-accent-uml/10 px-1 rounded truncate"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateMethod(data.id, method.id, { name: e.target.innerText.trim() })}
              >
                {method.name}
              </span>
              <span className="text-text-secondary">() :</span>
              <span 
                className={clsx(
                  "editable outline-none focus:bg-accent-uml/10 px-1 rounded truncate",
                  isClassType(method.returnType) && "text-accent-uml font-semibold"
                )}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateMethod(data.id, method.id, { returnType: e.target.innerText.trim() })}
              >
                {method.returnType}
              </span>
            </div>
            <button 
              className="delete-btn hidden group-hover/row:flex items-center justify-center text-red-500 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              onClick={() => deleteMethod(data.id, method.id)}
            >
              <Icons.X size={14} />
            </button>
          </div>
        ))}
        <button 
          onClick={() => addMethod(data.id)}
          className="add-row-btn w-full p-2 text-[12px] text-text-secondary hover:text-accent-uml font-medium transition-colors flex items-center justify-center gap-1"
        >
          <Icons.Plus size={12} /> Add Method
        </button>
      </div>
    </div>
  );
};
