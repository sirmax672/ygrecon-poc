"""Pydantic models for Graph DSL matching TypeScript types."""

from typing import Optional
from pydantic import BaseModel, Field


class ResourceDef(BaseModel):
    """Resource definition."""
    id: str
    label: str
    description: Optional[str] = None
    default: Optional[bool] = None
    active: Optional[bool] = Field(default=True)
    content: Optional[str] = None  # SVG icon/content


class NodePosition(BaseModel):
    """Node position in editor."""
    x: float
    y: float


class NodeVisual(BaseModel):
    """Visual properties of a node (presentation only)."""
    position: Optional[NodePosition] = None
    color: Optional[str] = None
    shape: Optional[str] = None


class NodeDef(BaseModel):
    """Node definition for DSL (minimal - only visual + params dict for serialization)."""
    id: str
    type: str
    params: dict = Field(default_factory=dict)  # For DSL serialization
    visual: Optional[NodeVisual] = Field(default_factory=NodeVisual)


class ConnectionVisual(BaseModel):
    """Visual properties of a connection (presentation only)."""
    points: list[dict] = Field(default_factory=list)  # Polyline bend points
    color: Optional[str] = None
    style: Optional[str] = None
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None


class ConnectionDef(BaseModel):
    """Connection definition (formerly EdgeDef)."""
    id: str
    type: str = "resource"  # "resource", "state", "trigger"
    from_: str = Field(alias="from")
    to: str
    params: dict = Field(default_factory=dict)  # For DSL serialization
    visual: Optional[ConnectionVisual] = Field(default_factory=ConnectionVisual)

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
    connections: list[ConnectionDef] = Field(default_factory=list)  # Renamed from edges
    # Keep edges for backward compatibility when reading (can be dict or ConnectionDef)
    edges: Optional[list] = None  # Can be list[dict] or list[ConnectionDef] for backward compatibility
    
    model_config = {"extra": "allow"}  # Allow extra fields for backward compatibility


class ValidationIssue(BaseModel):
    """Validation issue from graph-level checks."""
    code: str
    message: str
    nodeId: Optional[str] = None
    edgeId: Optional[str] = None  # Keep for backward compatibility
    connectionId: Optional[str] = None  # New name
