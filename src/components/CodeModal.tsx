import React, { useState, useMemo } from 'react';
import { useUmlStore } from '../store/useUmlStore';
import { Icons } from './Icons';
import { generateCode } from '../utils/codeGen';
import { highlightCode } from '../utils/highlighter';
import { clsx } from 'clsx';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose }) => {
  const { classes, connections } = useUmlStore();
  const [currentLang, setCurrentLang] = useState('java');
  const [copied, setCopied] = useState(false);

  const languages = [
    { id: 'java', label: 'Java' },
    { id: 'python', label: 'Python' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'csharp', label: 'C#' },
    { id: 'cpp', label: 'C++' }
  ];

  const rawCode = useMemo(() => {
    return generateCode(classes, connections, currentLang);
  }, [classes, connections, currentLang]);

  const highlightedCode = useMemo(() => {
    return highlightCode(rawCode, classes.map(c => c.name));
  }, [rawCode, classes]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[2000] p-4">
      <div className="bg-[var(--bg-toolbar)] w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-[var(--border)]">
        {/* Header */}
        <div className="p-5 px-6 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="text-xl font-bold">Code Generation</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Icons.X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-[var(--border)] bg-[var(--bg-toolbar)]">
          {languages.map(lang => (
            <button
              key={lang.id}
              onClick={() => setCurrentLang(lang.id)}
              className={clsx(
                "px-5 py-3 text-sm font-semibold transition-all border-b-2",
                currentLang === lang.id 
                  ? "text-[var(--accent)] border-[var(--accent)]" 
                  : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Code Area */}
        <div className="flex-grow overflow-auto bg-[#121212] relative">
          <pre className="p-8 font-mono text-[13px] leading-relaxed text-[#d4d4d4] whitespace-pre counter-reset-line">
            {highlightedCode.split('\n').map((line, i) => (
              <div key={i} className="flex">
                <span className="w-10 mr-5 text-right text-gray-600 select-none shrink-0">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: line || ' ' }} />
              </div>
            ))}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--border)] flex justify-end gap-3">
          <button 
            onClick={handleCopy}
            className="tool-btn ghost flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--btn-ghost-hover)] transition-all"
          >
            {copied ? <span className="text-green-500">Copied!</span> : (
              <>
                <Icons.Copy size={14} />
                Copy All
              </>
            )}
          </button>
          <button 
            onClick={onClose}
            className="tool-btn bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
