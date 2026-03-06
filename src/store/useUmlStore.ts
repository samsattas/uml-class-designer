import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClassData, Connection, RelationType, Attribute, Method } from '../types';

interface UmlState {
  classes: ClassData[];
  connections: Connection[];
  nextId: number;
  zoom: number;
  panX: number;
  panY: number;
  theme: 'dark' | 'light';
  relationType: RelationType;
  editingConn: Connection | null;
  
  // Actions
  addClass: () => void;
  updateClass: (id: number, data: Partial<ClassData>) => void;
  deleteClass: (id: number) => void;
  
  addConnection: (from: number, to: number) => void;
  updateConnection: (from: number, to: number, data: Partial<Connection>) => void;
  deleteConnection: (from: number, to: number) => void;
  
  setRelationType: (type: RelationType) => void;
  setEditingConn: (conn: Connection | null) => void;
  
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleTheme: () => void;
  clearAll: () => void;
  
  addAttribute: (classId: number) => void;
  updateAttribute: (classId: number, attrId: string, data: Partial<Attribute>) => void;
  deleteAttribute: (classId: number, attrId: string) => void;
  
  addMethod: (classId: number) => void;
  updateMethod: (classId: number, methodId: string, data: Partial<Method>) => void;
  deleteMethod: (classId: number, methodId: string) => void;
}

export const useUmlStore = create<UmlState>()(
  persist(
    (set) => ({
      classes: [],
      connections: [],
      nextId: 1,
      zoom: 1,
      panX: 0,
      panY: 0,
      theme: 'dark',
      relationType: 'association',
      editingConn: null,

      addClass: () => set((state) => {
        const id = state.nextId;
        const offset = (state.classes.length % 8) * 30;
        const newClass: ClassData = {
          id,
          name: `Class${id}`,
          x: (window.innerWidth / 2 - 120 - state.panX) / state.zoom + offset,
          y: (window.innerHeight / 2 - 100 - state.panY) / state.zoom + offset,
          attributes: [{ id: Math.random().toString(36).substr(2, 9), name: 'id', type: 'int', isList: false }],
          methods: [{ id: Math.random().toString(36).substr(2, 9), name: 'init', returnType: 'void' }]
        };
        return { 
          classes: [...state.classes, newClass],
          nextId: state.nextId + 1
        };
      }),

      updateClass: (id, data) => set((state) => ({
        classes: state.classes.map(c => c.id === id ? { ...c, ...data } : c)
      })),

      deleteClass: (id) => set((state) => ({
        classes: state.classes.filter(c => c.id !== id),
        connections: state.connections.filter(conn => conn.from !== id && conn.to !== id)
      })),

      addConnection: (from, to) => set((state) => {
        if (from === to) return state;
        const exists = state.connections.some(c => c.from === from && c.to === to);
        if (exists) return state;
        
        const newConn: Connection = {
          from,
          to,
          type: state.relationType,
          attributeName: '',
          isList: false
        };
        return { 
          connections: [...state.connections, newConn],
          editingConn: newConn
        };
      }),

      updateConnection: (from, to, data) => set((state) => ({
        connections: state.connections.map(c => (c.from === from && c.to === to) ? { ...c, ...data } : c)
      })),

      deleteConnection: (from, to) => set((state) => ({
        connections: state.connections.filter(c => !(c.from === from && c.to === to))
      })),

      setRelationType: (type) => set({ relationType: type }),
      setEditingConn: (conn) => set({ editingConn: conn }),
      
      setZoom: (zoom) => set({ zoom }),
      setPan: (x, y) => set({ panX: x, panY: y }),
      
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),

      clearAll: () => set({ classes: [], connections: [], nextId: 1 }),

      addAttribute: (classId) => set((state) => ({
        classes: state.classes.map(c => c.id === classId ? {
          ...c,
          attributes: [...c.attributes, { id: Math.random().toString(36).substr(2, 9), name: 'attr', type: 'String', isList: false }]
        } : c)
      })),

      updateAttribute: (classId, attrId, data) => set((state) => ({
        classes: state.classes.map(c => c.id === classId ? {
          ...c,
          attributes: c.attributes.map(a => a.id === attrId ? { ...a, ...data } : a)
        } : c)
      })),

      deleteAttribute: (classId, attrId) => set((state) => ({
        classes: state.classes.map(c => c.id === classId ? {
          ...c,
          attributes: c.attributes.filter(a => a.id !== attrId)
        } : c)
      })),

      addMethod: (classId) => set((state) => ({
        classes: state.classes.map(c => c.id === classId ? {
          ...c,
          methods: [...c.methods, { id: Math.random().toString(36).substr(2, 9), name: 'method', returnType: 'void' }]
        } : c)
      })),

      updateMethod: (classId, methodId, data) => set((state) => ({
        classes: state.classes.map(c => c.id === classId ? {
          ...c,
          methods: c.methods.map(m => m.id === methodId ? { ...m, ...data } : m)
        } : c)
      })),

      deleteMethod: (classId, methodId) => set((state) => ({
        classes: state.classes.map(c => c.id === classId ? {
          ...c,
          methods: c.methods.filter(m => m.id !== methodId)
        } : c)
      }))
    }),
    {
      name: 'uml-designer-storage',
      partialize: (state) => ({
        classes: state.classes,
        connections: state.connections,
        nextId: state.nextId,
        theme: state.theme
      })
    }
  )
);
