"""Base node instance class for validation."""

from typing import Optional, TYPE_CHECKING
from ...shared.dsl_schema import NodeDef, ValidationIssue

if TYPE_CHECKING:
    from ..graph import Graph


class NodeInstance:
    """Base class for node instances in the graph with validation capabilities."""

    def __init__(self, node_def: NodeDef):
        """
        Initialize node instance.

        Args:
            node_def: The node definition
        """
        self.node_def = node_def

    def validate_connection(
        self,
        graph: "Graph",
        from_node_id: str,
        to_node_id: str,
        source_handle: Optional[str] = None,
        target_handle: Optional[str] = None,
        edge_id: Optional[str] = None,
    ) -> list[ValidationIssue]:
        """
        Validate if a connection can be made from from_node_id to to_node_id.

        This method checks validation from the perspective of both nodes:
        - If this node is the source (from_node_id), validates outgoing connection
        - If this node is the target (to_node_id), validates incoming connection

        Override this method in subclasses to add type-specific validation.

        Args:
            graph: The Graph object (needed to access other nodes/edges)
            from_node_id: Source node ID
            to_node_id: Target node ID
            source_handle: Source handle ID (normalized, optional)
            target_handle: Target handle ID (normalized, optional)
            edge_id: Edge ID being created (optional, for error reporting)

        Returns:
            List of validation issues (empty if valid)
        """
        issues: list[ValidationIssue] = []

        # Check outgoing connection if this node is the source
        if from_node_id == self.node_def.id:
            outgoing_issues = self.validate_outgoing_connection(
                to_node_id, source_handle, target_handle, edge_id
            )
            issues.extend(outgoing_issues)

        # Check incoming connection if this node is the target
        if to_node_id == self.node_def.id:
            incoming_issues = self.validate_incoming_connection(
                from_node_id, source_handle, target_handle, edge_id
            )
            issues.extend(incoming_issues)

        return issues

    def validate_outgoing_connection(
        self,
        to_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: Optional[str],
    ) -> list[ValidationIssue]:
        """
        Validate if this node can create an outgoing connection.

        Override this method in subclasses to add type-specific validation.

        Args:
            to_node_id: Target node ID
            source_handle: Source handle ID (normalized)
            target_handle: Target handle ID (normalized)
            edge_id: Edge ID being created

        Returns:
            List of validation issues
        """
        # Base implementation - no restrictions by default
        return []

    def validate_incoming_connection(
        self,
        from_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: Optional[str],
    ) -> list[ValidationIssue]:
        """
        Validate if this node can receive an incoming connection.

        Override this method in subclasses to add type-specific validation.

        Args:
            from_node_id: Source node ID
            source_handle: Source handle ID (normalized)
            target_handle: Target handle ID (normalized)
            edge_id: Edge ID being created

        Returns:
            List of validation issues
        """
        # Base implementation - no restrictions by default
        return []

