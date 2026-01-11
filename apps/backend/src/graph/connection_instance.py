"""Connection instance base class for validation (formerly EdgeInstance)."""

from typing import Optional, TYPE_CHECKING
from ..shared.dsl_schema import ConnectionDef, ValidationIssue, ConnectionVisual

if TYPE_CHECKING:
    from .graph import Graph


def normalize_handle_id(handle_id: Optional[str]) -> Optional[str]:
    """Normalize handle ID - remove -target suffix if present."""
    if not handle_id:
        return None
    # Remove -target suffix if present (e.g., "top-1-target" -> "top-1")
    return handle_id.replace("-target", "")


class ConnectionInstance:
    """Represents a connection instance in the graph with validation capabilities."""

    # Common attributes for all connections
    id: str
    type: str  # "resource", "state", "trigger"
    from_node_id: str
    to_node_id: str
    visual: ConnectionVisual

    def __init__(self, connection_def: ConnectionDef):
        """
        Initialize connection instance from ConnectionDef.
        Subclasses should extract params into typed attributes.

        Args:
            connection_def: The connection definition
        """
        self.id = connection_def.id
        self.type = connection_def.type or "resource"
        self.from_node_id = connection_def.from_
        self.to_node_id = connection_def.to
        
        # Initialize visual, migrating handles from params if needed (backward compatibility)
        visual_data = {}
        if connection_def.visual:
            visual_data = connection_def.visual.model_dump()
        # Migrate handles from params if not in visual (backward compatibility)
        if not visual_data.get("source_handle") and connection_def.params.get("sourceHandle"):
            visual_data["source_handle"] = connection_def.params.get("sourceHandle")
        if not visual_data.get("target_handle") and connection_def.params.get("targetHandle"):
            visual_data["target_handle"] = connection_def.params.get("targetHandle")
        if not visual_data.get("points") and connection_def.params.get("points"):
            visual_data["points"] = connection_def.params.get("points")
        
        self.visual = ConnectionVisual(**visual_data)
        # Store raw params for validation (subclasses will extract to typed attrs)
        self._connection_def = connection_def
    
    def to_connection_def(self) -> ConnectionDef:
        """
        Convert instance back to ConnectionDef for serialization.
        Subclasses must override to populate params dict from attributes.
        
        Returns:
            ConnectionDef object for DSL serialization
        """
        raise NotImplementedError("Subclasses must implement to_connection_def()")

    def validate_structure(self, graph: "Graph") -> list[ValidationIssue]:
        """
        Validate base structural rules for this connection.

        Checks:
        - No duplicate connections in the same direction
        - No reverse connection on the same handles

        Args:
            graph: The Graph object (needed to access existing connections)

        Returns:
            List of validation issues
        """
        issues: list[ValidationIssue] = []

        source_handle = normalize_handle_id(
            self.visual.source_handle
        )
        target_handle = normalize_handle_id(
            self.visual.target_handle
        )

        # Rule 1: Check for duplicate connection (same from->to)
        duplicate = next(
            (
                conn
                for conn in graph.connections
                if conn.id != self.id
                and conn.from_node_id == self.from_node_id
                and conn.to_node_id == self.to_node_id
            ),
            None,
        )

        if duplicate:
            issues.append(
                ValidationIssue(
                    code="DUPLICATE_CONNECTION",
                    message=f"Duplicate connection from {self.from_node_id} to {self.to_node_id}. Only one connection allowed per direction.",
                    connectionId=self.id,
                    edgeId=self.id,  # Keep for backward compatibility
                    nodeId=self.from_node_id,
                )
            )

        # Rule 2: Check for reverse connection on same handles
        if source_handle and target_handle:
            reverse = next(
                (
                    conn
                    for conn in graph.connections
                    if conn.id != self.id
                    and conn.from_node_id == self.to_node_id
                    and conn.to_node_id == self.from_node_id
                    and normalize_handle_id(conn.visual.source_handle) == target_handle
                    and normalize_handle_id(conn.visual.target_handle) == source_handle
                ),
                None,
            )

            if reverse:
                issues.append(
                    ValidationIssue(
                        code="REVERSE_CONNECTION_ON_SAME_HANDLES",
                        message=f"Cannot create reverse connection {self.from_node_id}[{source_handle}]->{self.to_node_id}[{target_handle}] because reverse connection {reverse.id} already exists on the same handles.",
                        connectionId=self.id,
                        edgeId=self.id,  # Keep for backward compatibility
                        nodeId=self.from_node_id,
                    )
                )

        return issues
