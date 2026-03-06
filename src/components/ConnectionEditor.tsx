import React, { useState, useEffect } from 'react';
import { useUmlStore } from '../store/useUmlStore';

interface ConnectionEditorProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ConnectionEditor: React.FC<ConnectionEditorProps> = ({ x, y, onClose }) => {
  const { editingConn, updateConnection, setEditingConn } = useUmlStore();
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

  return (
    <div 
      className="fixed bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl shadow-[var(--shadow)] z-[1500] flex flex-col gap-3 min-w-[200px]"
      style={{ 
        left: Math.min(x, window.innerWidth - 220), 
        top: Math.min(y, window.innerHeight - 200) 
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="text-[11px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Field Name</label>
      <input 
        type="text" 
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. students"
        className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-[var(--accent)]"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="conn-is-list"
          checked={isList}
          onChange={(e) => setIsList(e.target.checked)}
          className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
        />
        <label htmlFor="conn-is-list" className="text-sm cursor-pointer select-none">Is Collection (List)</label>
      </div>
      <button 
        onClick={handleSave}
        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2 rounded-lg font-medium transition-all active:scale-95"
      >
        Save
      </button>
    </div>
  );
};
