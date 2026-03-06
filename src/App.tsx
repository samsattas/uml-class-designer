import React, { useState, useEffect } from 'react';
import { useUmlStore } from './store/useUmlStore';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { CodeModal } from './components/CodeModal';
import { ConnectionEditor } from './components/ConnectionEditor';
import { Connection } from './types';

const App: React.FC = () => {
  const { theme, editingConn, setEditingConn } = useUmlStore();
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [editorPos, setEditorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const handleEditConnection = (conn: Connection, x: number, y: number) => {
    setEditingConn(conn);
    setEditorPos({ x, y });
  };

  return (
    <div className="relative w-full h-full">
      <Toolbar onGenerateCode={() => setIsCodeModalOpen(true)} />
      
      <Canvas onEditConnection={handleEditConnection} />
      
      {editingConn && (
        <ConnectionEditor 
          x={editorPos.x} 
          y={editorPos.y} 
          onClose={() => setEditingConn(null)} 
        />
      )}
      
      <CodeModal 
        isOpen={isCodeModalOpen} 
        onClose={() => setIsCodeModalOpen(false)} 
      />
    </div>
  );
};

export default App;
