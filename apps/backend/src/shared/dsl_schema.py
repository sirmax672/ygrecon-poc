"""Pydantic models for Graph DSL matching TypeScript types."""

from typing import Optional
from pydantic import BaseModel, Field


class ResourceDef(BaseModel):
    """Resource definition."""
    id: str
    label: str


class NodePosition(BaseModel):
    """Node position in editor."""
    x: float
    y: float


class NodeDef(BaseModel):
    """Node definition."""
    id: str
    type: str
    params: dict = Field(default_factory=dict)
    position: Optional[NodePosition] = None


class EdgeDef(BaseModel):
    """Edge definition."""
    id: str
    from_: str = Field(alias="from")
    to: str
    params: dict = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class GraphMeta(BaseModel):
    """Graph metadata."""
    name: str
    seed: int
    timeUnit: Optional[str] = None
    notes: Optional[str] = None


class GraphDSL(BaseModel):
    """Graph DSL v0.2 structure."""
    dslVersion: str = "0.2"
    meta: GraphMeta
    resources: list[ResourceDef] = Field(default_factory=list)
    nodes: list[NodeDef] = Field(default_factory=list)
    edges: list[EdgeDef] = Field(default_factory=list)


class ValidationIssue(BaseModel):
    """Validation issue from graph-level checks."""
    code: str
    message: str
    nodeId: Optional[str] = None
    edgeId: Optional[str] = None

