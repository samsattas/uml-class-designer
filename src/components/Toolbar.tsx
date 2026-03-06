import React from 'react';
import { useUmlStore } from '../store/useUmlStore';
import { Icons } from './Icons';
import { RelationType } from '../types';

interface ToolbarProps {
  onGenerateCode: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onGenerateCode }) => {
  const { 
    addClass, 
    relationType, 
    setRelationType, 
    theme, 
    toggleTheme, 
    clearAll 
  } = useUmlStore();

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire canvas?')) {
      clearAll();
    }
  };

  return (
    <div id="toolbar" className="fixed top-0 left-0 right-0 h-20 bg-bg-toolbar text-text-primary flex items-center px-12 z-[1000] border-b border-border-uml gap-8 shadow-md">
      <button 
        onClick={addClass}
        className="tool-btn bg-accent-uml hover:bg-accent-hover-uml text-white px-6 py-2.5 rounded-full flex items-center gap-2.5 font-semibold transition-all shadow-lg active:scale-95"
        title="Create a new class box"
      >
        <Icons.Plus size={18} />
        Add Class
      </button>

      <div className="h-8 w-[1px] bg-border-uml mx-2"></div>

      <select 
        value={relationType}
        onChange={(e) => setRelationType(e.target.value as RelationType)}
        className="bg-bg-card text-text-primary border border-border-uml px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent-uml cursor-pointer hover:border-accent-uml transition-colors"
        title="Select relationship type for new connections"
      >
        <option value="association">Association (→)</option>
        <option value="inheritance">Inheritance (△)</option>
        <option value="aggregation">Aggregation (◇→)</option>
        <option value="composition">Composition (◆→)</option>
      </select>

      <button 
        onClick={toggleTheme}
        className="tool-btn ghost bg-transparent hover:bg-white/5 dark:hover:bg-white/5 text-text-primary border border-border-uml p-3 rounded-full transition-all flex items-center justify-center"
        title="Toggle Dark/Light mode"
      >
        {theme === 'dark' ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
      </button>

      <button 
        onClick={handleClear}
        className="tool-btn danger bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2.5 font-semibold transition-all shadow-lg active:scale-95"
        title="Wipe entire canvas"
      >
        <Icons.Trash size={18} />
        Clear All
      </button>

      <div className="flex-grow"></div>

      <button 
        onClick={onGenerateCode}
        className="tool-btn bg-accent-uml hover:bg-accent-hover-uml text-white px-6 py-2.5 rounded-full flex items-center gap-2.5 font-semibold transition-all shadow-lg active:scale-95"
      >
        <Icons.Code size={18} />
        Generate Code
      </button>
    </div>
  );
};
