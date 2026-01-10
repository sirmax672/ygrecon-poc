/**
 * REST API client for project management.
 */

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectDetail extends Project {
  graph: unknown; // GraphDSL
}

const API_BASE = '/api/projects';

export async function listProjects(): Promise<Project[]> {
  const response = await fetch(API_BASE + '/');
  if (!response.ok) {
    throw new Error(`Failed to list projects: ${response.statusText}`);
  }
  return response.json();
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const response = await fetch(`${API_BASE}/${projectId}`);
  if (!response.ok) {
    throw new Error(`Failed to get project: ${response.statusText}`);
  }
  return response.json();
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const response = await fetch(API_BASE + '/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description: description || null,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.statusText}`);
  }
  return response.json();
}

export async function updateProject(
  projectId: string,
  name?: string,
  description?: string
): Promise<Project> {
  const response = await fetch(`${API_BASE}/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description: description !== undefined ? description : null,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update project: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${projectId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.statusText}`);
  }
}

export type { Project, ProjectDetail };
