"""Session management for WebSocket connections."""

import uuid
from datetime import datetime
from typing import Optional
from ..shared.dsl_schema import GraphDSL, GraphMeta, ResourceDef


class Session:
    """Represents a session with a graph state."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = datetime.now()
        # Initialize with empty graph
        self.graph = GraphDSL(
            dslVersion="0.2",
            meta=GraphMeta(name="", seed=12345),
            resources=[],
            nodes=[],
            edges=[],
        )

    def get_graph(self) -> GraphDSL:
        """Get current graph state."""
        return self.graph

    def update_graph(self, graph: GraphDSL) -> None:
        """Update graph state."""
        self.graph = graph


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

