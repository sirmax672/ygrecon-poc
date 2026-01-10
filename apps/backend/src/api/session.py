"""Session management for WebSocket connections."""

import uuid
from datetime import datetime
from typing import Optional
from ..shared.dsl_schema import GraphDSL, GraphMeta, ResourceDef
from ..graph.graph import Graph


class Session:
    """Represents a session with a graph state."""

    def __init__(self, session_id: str, project_id: Optional[str] = None):
        self.session_id = session_id
        self.project_id = project_id  # Optional link to project in DB
        self.created_at = datetime.now()
        # Initialize with empty graph (instances in memory)
        self.graph = Graph(
            meta=GraphMeta(name="", seed=12345),
            resources=[],
            nodes=[],
            edges=[],
        )

    def get_graph(self) -> Graph:
        """Get current graph state."""
        return self.graph

    def get_graph_dsl(self) -> GraphDSL:
        """Get graph as DSL (for serialization/communication)."""
        return self.graph.to_dsl()

    def load_from_dsl(self, dsl: GraphDSL) -> None:
        """Load graph from DSL (when loading from DB)."""
        self.graph = Graph.from_dsl(dsl)

    def set_project_id(self, project_id: Optional[str]) -> None:
        """Link session to a project."""
        self.project_id = project_id


# Global session storage (in-memory)
# In production, this should be replaced with Redis or database
_sessions: dict[str, Session] = {}


def create_session() -> Session:
    """Create a new session."""
    session_id = str(uuid.uuid4())
    session = Session(session_id)
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> Optional[Session]:
    """Get session by ID."""
    return _sessions.get(session_id)


def delete_session(session_id: str) -> None:
    """Delete a session."""
    if session_id in _sessions:
        del _sessions[session_id]

