import React, { useState, useEffect } from 'react';
import { useUmlStore } from '../store/useUmlStore';
import { Icons } from './Icons';

interface ConnectionEditorProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ConnectionEditor: React.FC<ConnectionEditorProps> = ({ x, y, onClose }) => {
  const { editingConn, updateConnection, deleteConnection, setEditingConn, setSelectedConn } = useUmlStore();
  const [name, setName] = useState(editingConn?.attributeName || '');
  const [isList, setIsList] = useState(editingConn?.isList || false);

  useEffect(() => {
    if (editingConn) {
      setName(editingConn.attributeName);
      setIsList(editingConn.isList);
    }
  }, [editingConn]);

  if (!editingConn) return null;

  const handleSave = () => {
    updateConnection(editingConn.from, editingConn.to, {
      attributeName: name.trim(),
      isList
    });
    setEditingConn(null);
    onClose();
  };

  const handleDelete = () => {
    deleteConnection(editingConn.from, editingConn.to);
    setSelectedConn(null);
    setEditingConn(null);
    onClose();
  };

  const handleBackdropClick = () => {
    setEditingConn(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1400]" onClick={handleBackdropClick}>
      <div
        className="fixed bg-bg-card border border-border-uml p-4 rounded-lg shadow-lg z-[1500] flex flex-col gap-3 w-[240px]"
        style={{
          left: Math.min(x, window.innerWidth - 260),
          top: Math.min(y, window.innerHeight - 220)
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <label className="text-xs text-text-secondary font-medium">Field Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. students"
          className="h-9 bg-input-bg border border-border-uml text-text-primary px-3 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-uml"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="conn-is-list"
            checked={isList}
            onChange={(e) => setIsList(e.target.checked)}
            className="h-4 w-4 rounded border-border-uml accent-accent-uml cursor-pointer"
          />
          <label htmlFor="conn-is-list" className="text-sm cursor-pointer select-none text-text-primary">Is Collection (List)</label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 inline-flex items-center justify-center bg-accent-uml hover:bg-accent-hover-uml text-white h-9 rounded-md text-sm font-medium transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border-uml text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete connection"
          >
            <Icons.Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
