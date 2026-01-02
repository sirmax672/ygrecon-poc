import { create } from 'zustand';
import type { GraphDSL } from '@ygrecon/dsl';
import type { Node, Edge } from '@xyflow/react';

/**
 * Editor state snapshot for undo/redo
 */
interface EditorSnapshot {
  nodes: Node[];
  edges: Edge[];
  dsl: GraphDSL;
}

/**
 * Editor store with undo/redo support
 */
interface EditorStore {
  // Current state
  nodes: Node[];
  edges: Edge[];
  dsl: GraphDSL | null;
  validationErrors: string[];
  
  // Undo/redo stacks
  history: EditorSnapshot[];
  historyIndex: number;
  
  // Actions
  setNodes: (nodes: Node[], saveHistory?: boolean) => void;
  setEdges: (edges: Edge[], saveHistory?: boolean) => void;
  setDSL: (dsl: GraphDSL, saveHistory?: boolean) => void;
  setValidationErrors: (errors: string[]) => void;
  
  // Undo/redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // History management
  saveSnapshot: () => void;
  loadSnapshot: (snapshot: EditorSnapshot) => void;
  
  // Selection
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  
  // Edge creation mode
  edgeCreationMode: boolean;
  edgeCreationSourceNodeId: string | null;
  setEdgeCreationMode: (enabled: boolean) => void;
  setEdgeCreationSourceNodeId: (nodeId: string | null) => void;
}

const MAX_HISTORY = 50;

const createInitialDSL = (): GraphDSL => ({
  dslVersion: '0.2',
  meta: {
    name: 'Untitled Graph',
    seed: Math.floor(Math.random() * 1000000),
  },
  resources: [],
  nodes: [],
  edges: [],
});

export const useEditorStore = create<EditorStore>((set, get) => ({
  nodes: [],
  edges: [],
  dsl: createInitialDSL(),
  validationErrors: [],
  history: [],
  historyIndex: -1,
  selectedNodeId: null,
  selectedEdgeId: null,
  edgeCreationMode: false,
  edgeCreationSourceNodeId: null,
  
  setNodes: (nodes, saveHistory = true) => {
    set({ nodes });
    if (saveHistory) {
      get().saveSnapshot();
    }
  },
  
  setEdges: (edges, saveHistory = true) => {
    set({ edges });
    if (saveHistory) {
      get().saveSnapshot();
    }
  },
  
  setDSL: (dsl, saveHistory = true) => {
    set({ dsl });
    if (saveHistory) {
      get().saveSnapshot();
    }
  },
  
  setValidationErrors: (errors) => {
    set({ validationErrors: errors });
  },
  
  saveSnapshot: () => {
    const { nodes, edges, dsl } = get();
    if (!dsl) return;
    
    const snapshot: EditorSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      dsl: JSON.parse(JSON.stringify(dsl)),
    };
    
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(snapshot);
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
  
  loadSnapshot: (snapshot) => {
    // Don't save history when loading a snapshot (undo/redo)
    get().setNodes(snapshot.nodes, false);
    get().setEdges(snapshot.edges, false);
    get().setDSL(snapshot.dsl, false);
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const snapshot = history[newIndex];
      get().loadSnapshot(snapshot);
      set({ historyIndex: newIndex });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const snapshot = history[newIndex];
      get().loadSnapshot(snapshot);
      set({ historyIndex: newIndex });
    }
  },
  
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },
  
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
  
  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id, selectedEdgeId: null });
  },
  
  setSelectedEdgeId: (id) => {
    set({ selectedEdgeId: id, selectedNodeId: null });
  },
  
  setEdgeCreationMode: (enabled) => {
    set({ 
      edgeCreationMode: enabled,
      edgeCreationSourceNodeId: null, // Reset source when toggling
    });
  },
  
  setEdgeCreationSourceNodeId: (nodeId) => {
    set({ edgeCreationSourceNodeId: nodeId });
  },
}));

