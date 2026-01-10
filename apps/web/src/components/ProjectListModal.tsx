import { useState, useEffect, useCallback } from 'react';
import { listProjects, createProject, updateProject, deleteProject, type Project } from '../services/projectsApi';

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (projectId: string) => void;
  onCreate: (projectId: string) => void;
  currentProjectId: string | null;
}

export function ProjectListModal({
  isOpen,
  onClose,
  onSelect,
  onCreate,
  currentProjectId,
}: ProjectListModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projectsList = await listProjects();
      setProjects(projectsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRenameStart = useCallback((project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
  }, []);

  const handleRenameCancel = useCallback(() => {
    setEditingId(null);
    setEditingName('');
  }, []);

  const handleRenameSave = useCallback(
    async (projectId: string) => {
      if (!editingName.trim()) {
        setError('Project name cannot be empty');
        return;
      }

      try {
        await updateProject(projectId, editingName);
        await loadProjects();
        setEditingId(null);
        setEditingName('');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rename project');
      }
    },
    [editingName, loadProjects]
  );

  const handleDelete = useCallback(
    async (projectId: string) => {
      if (!confirm('Are you sure you want to delete this project?')) {
        return;
      }

      try {
        await deleteProject(projectId);
        await loadProjects();
        if (projectId === currentProjectId) {
          onSelect(''); // Clear selection if deleted project was current
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete project');
      }
    },
    [currentProjectId, loadProjects, onSelect]
  );

  const handleCreate = useCallback(async () => {
    if (!newProjectName.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const newProject = await createProject(newProjectName.trim());
      await loadProjects();
      setNewProjectName('');
      onCreate(newProject.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  }, [newProjectName, loadProjects, onCreate, onClose]);

  const handleSelect = useCallback(
    (projectId: string) => {
      onSelect(projectId);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Projects</h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '32px',
              height: '32px',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '8px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              color: '#721c24',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Create new project */}
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #ddd' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="New project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleCreate}
              disabled={isCreating || !newProjectName.trim()}
              style={{
                padding: '8px 16px',
                border: '1px solid #28a745',
                borderRadius: '4px',
                backgroundColor: '#28a745',
                color: '#fff',
                cursor: isCreating || !newProjectName.trim() ? 'not-allowed' : 'pointer',
                opacity: isCreating || !newProjectName.trim() ? 0.5 : 1,
              }}
            >
              {isCreating ? 'Creating...' : 'New'}
            </button>
          </div>
        </div>

        {/* Projects list */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading...</div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No projects yet. Create one above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: project.id === currentProjectId ? '#e7f3ff' : '#fff',
                  }}
                >
                  {editingId === project.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSave(project.id);
                          } else if (e.key === 'Escape') {
                            handleRenameCancel();
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '6px',
                          border: '1px solid #007bff',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                      <button
                        onClick={() => handleRenameSave(project.id)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #28a745',
                          borderRadius: '4px',
                          backgroundColor: '#28a745',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleRenameCancel}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: project.id === currentProjectId ? 'bold' : 'normal',
                            fontSize: '14px',
                            marginBottom: '4px',
                          }}
                        >
                          {project.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(project.updated_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelect(project.id)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #007bff',
                          borderRadius: '4px',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleRenameStart(project)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ffc107',
                          borderRadius: '4px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #dc3545',
                          borderRadius: '4px',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
