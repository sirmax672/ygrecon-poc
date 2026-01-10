import { useEditorStore } from '../store/editorStore';
import { getWebSocketClient } from '../services/websocket';
import { xyFlowToDSL } from '../utils/dslConverter';
import { dslToXYFlow } from '../utils/dslConverter';
import { ProjectListModal } from './ProjectListModal';
import { useCallback, useState, useEffect } from 'react';
import { listProjects, type Project } from '../services/projectsApi';
import type { GraphDSL } from '@ygrecon/dsl';

interface ProjectManagerProps {
  currentProjectId: string | null;
  onProjectIdChange: (projectId: string | null) => void;
}

export function ProjectManager({ currentProjectId, onProjectIdChange }: ProjectManagerProps) {
  const {
    nodes,
    edges,
    dsl,
    setNodes,
    setEdges,
    setDSL,
    setValidationErrors,
  } = useEditorStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);

  // Load current project name when project ID changes
  useEffect(() => {
    if (currentProjectId) {
      listProjects()
        .then((projects) => {
          const project = projects.find((p) => p.id === currentProjectId);
          setCurrentProjectName(project?.name || null);
        })
        .catch(() => {
          setCurrentProjectName(null);
        });
    } else {
      setCurrentProjectName(null);
    }
  }, [currentProjectId]);

  const handleSave = useCallback(async () => {
    if (!dsl) {
      setError('No graph to save');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const wsClient = getWebSocketClient();
      
      console.log('Saving project, currentProjectId:', currentProjectId);
      
      // If no project ID in state, try to use session.project_id from backend
      // Otherwise use currentProjectId or create new project named "default"
      const result = await wsClient.saveProject({
        projectId: currentProjectId || undefined,
        name: currentProjectId ? undefined : 'default',
        // userId is handled on backend (same as REST API)
      });

      console.log('Project saved, result:', result);
      onProjectIdChange(result.project_id);
    } catch (err) {
      console.error('Failed to save project:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, dsl, currentProjectId, onProjectIdChange]);

  const handleLoad = useCallback(async (projectId: string) => {
    if (!projectId) {
      // Clear current project
      onProjectIdChange(null);
      return;
    }

    setError(null);

    try {
      console.log('Loading project:', projectId);
      const wsClient = getWebSocketClient();
      // user_id is handled on backend (same as REST API)
      const result = await wsClient.loadProject(projectId); // TODO: Get from authentication

      console.log('Project loaded, result:', result);

      // Convert DSL to XYFlow format
      const graphDSL = result.graph as GraphDSL;
      const { nodes: newNodes, edges: newEdges } = dslToXYFlow(graphDSL);

      // Update state
      setDSL(graphDSL);
      setNodes(newNodes);
      setEdges(newEdges);
      setValidationErrors([]);
      
      // IMPORTANT: Update currentProjectId after loading
      onProjectIdChange(result.project_id);
      console.log('Project ID set to:', result.project_id);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    }
  }, [setDSL, setNodes, setEdges, setValidationErrors, onProjectIdChange]);

  const handleCreate = useCallback(async (projectId: string) => {
    onProjectIdChange(projectId);
    
    // If there's a current graph, save it to the new project immediately
    if (dsl && nodes.length > 0) {
      setIsSaving(true);
      setError(null);
      
      try {
        const wsClient = getWebSocketClient();
        const currentDSL = xyFlowToDSL(nodes, edges, dsl);
        
        // Save current graph to the new project
        await wsClient.saveProject({
          projectId: projectId,
          // userId is handled on backend (same as REST API)
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save to new project');
      } finally {
        setIsSaving(false);
      }
    }
  }, [onProjectIdChange, dsl, nodes, edges]);

  return (
    <>
      <div style={{ padding: '8px', borderBottom: '1px solid #ddd', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Project: {currentProjectName || currentProjectId || 'none'}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '6px 12px',
              border: '1px solid #6c757d',
              borderRadius: '4px',
              backgroundColor: '#6c757d',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Load / New
          </button>
          <button
            onClick={handleSave}
            disabled={!dsl || isSaving}
            style={{
              padding: '6px 12px',
              border: '1px solid #007bff',
              borderRadius: '4px',
              backgroundColor: '#007bff',
              color: '#fff',
              cursor: dsl && !isSaving ? 'pointer' : 'not-allowed',
              opacity: dsl && !isSaving ? 1 : 0.5,
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {error && (
            <span style={{ fontSize: '12px', color: '#dc3545' }}>{error}</span>
          )}
        </div>
      </div>
      <ProjectListModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          // Reload current project name after modal closes (in case it was renamed)
          if (currentProjectId) {
            listProjects()
              .then((projects) => {
                const project = projects.find((p) => p.id === currentProjectId);
                setCurrentProjectName(project?.name || null);
              })
              .catch(() => {
                setCurrentProjectName(null);
              });
          }
        }}
        onSelect={handleLoad}
        onCreate={handleCreate}
        currentProjectId={currentProjectId}
      />
    </>
  );
}
