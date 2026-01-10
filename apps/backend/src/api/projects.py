"""REST API for project management."""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..db.database import get_db
from ..db.models import User, Project
from ..shared.dsl_schema import GraphDSL, GraphMeta

router = APIRouter(prefix="/api/projects", tags=["projects"])


# Pydantic models for request/response
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    graph: Optional[dict] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    graph: Optional[dict] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectResponse):
    graph: dict


# Authentication stub (temporary for POC)
async def get_current_user(db: Session = Depends(get_db)) -> User:
    """Get current user (stub for POC, returns test user)."""
    # TODO: Replace with real authentication (JWT or session-based)
    # For now, create or return a test user
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        test_user = User(
            email="test@example.com",
            username="testuser",
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
    return test_user


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all projects for current user."""
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return [
        ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            created_at=p.created_at.isoformat(),
            updated_at=p.updated_at.isoformat(),
        )
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get project by ID."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Parse DSL JSON
    graph = json.loads(project.dsl_data)

    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        graph=graph,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat(),
    )


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create new project."""
    # Validate DSL if graph provided
    if project_data.graph:
        GraphDSL.model_validate(project_data.graph)
        dsl_json = json.dumps(project_data.graph)
    else:
        # Create empty graph
        empty_graph = GraphDSL(
            dslVersion="0.2",
            meta=GraphMeta(name=project_data.name, seed=12345),
            resources=[],
            nodes=[],
            edges=[],
        )
        dsl_json = empty_graph.model_dump_json()

    # Create project
    project = Project(
        user_id=current_user.id,
        name=project_data.name,
        description=project_data.description,
        dsl_data=dsl_json,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat(),
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update existing project."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.graph is not None:
        # Validate DSL
        GraphDSL.model_validate(project_data.graph)
        project.dsl_data = json.dumps(project_data.graph)
        # updated_at will be set automatically by onupdate

    db.commit()
    db.refresh(project)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat(),
    )


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete project."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()

    return {"deleted": project_id}
