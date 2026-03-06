import React, { useState, useRef, useEffect } from 'react';
import { useUmlStore } from '../store/useUmlStore';
import { Icons } from './Icons';
import { RelationType } from '../types';

interface ToolbarProps {
  onGenerateCode: () => void;
}

const RelationIcon: React.FC<{ type: RelationType; size?: number }> = ({ type, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {type === 'association' && (
      <>
        <line x1="4" y1="12" x2="18" y2="12" />
        <polyline points="14 8 18 12 14 16" />
      </>
    )}
    {type === 'inheritance' && (
      <>
        <line x1="4" y1="12" x2="14" y2="12" />
        <polygon points="14 8 20 12 14 16" fill="none" />
      </>
    )}
    {type === 'aggregation' && (
      <>
        <polygon points="4 12 8 8 12 12 8 16" fill="none" />
        <line x1="12" y1="12" x2="18" y2="12" />
        <polyline points="14 8 18 12 14 16" />
      </>
    )}
    {type === 'composition' && (
      <>
        <polygon points="4 12 8 8 12 12 8 16" fill="currentColor" stroke="currentColor" />
        <line x1="12" y1="12" x2="18" y2="12" />
        <polyline points="14 8 18 12 14 16" />
      </>
    )}
  </svg>
);

const relationOptions: { value: RelationType; label: string }[] = [
  { value: 'association', label: 'Association' },
  { value: 'inheritance', label: 'Inheritance' },
  { value: 'aggregation', label: 'Aggregation' },
  { value: 'composition', label: 'Composition' },
];

export const Toolbar: React.FC<ToolbarProps> = ({ onGenerateCode }) => {
  const {
    addClass,
    relationType,
    setRelationType,
    theme,
    toggleTheme,
    clearAll
  } = useUmlStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire canvas?')) {
      clearAll();
    }
  };

  const selectedLabel = relationOptions.find(o => o.value === relationType)?.label ?? '';

  return (
    <div id="toolbar" className="fixed top-0 left-0 right-0 h-14 bg-bg-toolbar text-text-primary flex items-center px-4 z-[1000] border-b border-border-uml gap-2">
      <button
        onClick={addClass}
        className="inline-flex items-center gap-2 bg-accent-uml hover:bg-accent-hover-uml text-white h-9 px-4 rounded-md text-sm font-medium transition-colors"
        title="Create a new class box"
      >
        <Icons.Plus size={16} />
        Add Class
      </button>

      <div className="h-6 w-px bg-border-uml mx-1.5"></div>

      {/* Custom Select */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border-uml text-sm font-medium hover:bg-accent-uml/10 transition-colors min-w-[180px] justify-between"
          title="Select relationship type for new connections"
        >
          <span className="inline-flex items-center gap-2">
            <RelationIcon type={relationType} size={18} />
            {selectedLabel}
          </span>
          <Icons.ChevronDown size={14} className="text-text-secondary" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-bg-card border border-border-uml rounded-md shadow-lg py-1 z-50">
            {relationOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setRelationType(opt.value);
                  setDropdownOpen(false);
                }}
                className="w-full inline-flex items-center gap-2 px-3 h-9 text-sm hover:bg-accent-uml/10 transition-colors"
              >
                <RelationIcon type={opt.value} size={18} />
                <span className="flex-1 text-left">{opt.label}</span>
                {relationType === opt.value && (
                  <Icons.Check size={14} className="text-accent-uml" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-6 w-px bg-border-uml mx-1.5"></div>

      <button
        onClick={toggleTheme}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border-uml text-text-secondary hover:bg-accent-uml/10 hover:text-text-primary transition-colors"
        title="Toggle Dark/Light mode"
      >
        {theme === 'dark' ? <Icons.Moon size={16} /> : <Icons.Sun size={16} />}
      </button>

      <button
        onClick={handleClear}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium border border-border-uml text-red-500 hover:bg-red-500/10 transition-colors"
        title="Wipe entire canvas"
      >
        <Icons.Trash size={16} />
        Clear All
      </button>

      <div className="flex-grow"></div>

      <button
        onClick={onGenerateCode}
        className="inline-flex items-center gap-2 bg-accent-uml hover:bg-accent-hover-uml text-white h-9 px-4 rounded-md text-sm font-medium transition-colors"
      >
        <Icons.Code size={16} />
        Generate Code
      </button>
    </div>
  );
};
