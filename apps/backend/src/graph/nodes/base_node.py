"""Base node instance class for validation."""

from typing import Optional
from ...shared.dsl_schema import NodeDef, ValidationIssue, GraphDSL


class NodeInstance:
    """Base class for node instances in the graph with validation capabilities."""

    def __init__(self, node_def: NodeDef, graph: GraphDSL):
        """
        Initialize node instance.

        Args:
            node_def: The node definition
            graph: The full graph DSL (needed for validation)
        """
        self.node_def = node_def
        self.graph = graph

    def validate_outgoing_connection(
        self,
        to_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: str,
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
        edge_id: str,
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

