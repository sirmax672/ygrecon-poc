"""Node instance class for validation."""

from typing import Optional
from ..shared.dsl_schema import NodeDef, ValidationIssue, GraphDSL
from ..node_types.core import get_node_type


class NodeInstance:
    """Represents a node instance in the graph with validation capabilities."""

    def __init__(self, node_def: NodeDef, graph: GraphDSL):
        """
        Initialize node instance.

        Args:
            node_def: The node definition
            graph: The full graph DSL (needed for node-type validation)
        """
        self.node_def = node_def
        self.graph = graph
        self.node_type = get_node_type(node_def.type)

    def validate_outgoing_connection(
        self,
        to_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: str,
    ) -> list[ValidationIssue]:
        """
        Validate if this node can create an outgoing connection.

        Args:
            to_node_id: Target node ID
            source_handle: Source handle ID (normalized)
            target_handle: Target handle ID (normalized)
            edge_id: Edge ID being created

        Returns:
            List of validation issues
        """
        issues: list[ValidationIssue] = []

        if not self.node_type:
            # Unknown node type - allow connection (fail open)
            return issues

        # Delegate to node type's validate_connection
        # For outgoing, we pass this node as from_node
        node_issues = self.node_type.validate_connection(
            self.graph,
            self.node_def.id,
            to_node_id,
            source_handle,
            target_handle,
        )

        # Add edge_id to issues
        issues.extend(
            ValidationIssue(**{**issue.model_dump(), "edgeId": edge_id})
            for issue in node_issues
        )

        return issues

    def validate_incoming_connection(
        self,
        from_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: str,
    ) -> list[ValidationIssue]:
        """
        Validate if this node can receive an incoming connection.

        Args:
            from_node_id: Source node ID
            source_handle: Source handle ID (normalized)
            target_handle: Target handle ID (normalized)
            edge_id: Edge ID being created

        Returns:
            List of validation issues
        """
        issues: list[ValidationIssue] = []

        if not self.node_type:
            # Unknown node type - allow connection (fail open)
            return issues

        # For incoming validation, we swap from/to to represent from target's perspective
        # The node type's validate_connection checks if the target node (this node)
        # can receive a connection from the source node
        node_issues = self.node_type.validate_connection(
            self.graph,
            self.node_def.id,  # this node is the "from" from target's perspective
            from_node_id,  # original source is "to" from target's perspective
            target_handle,  # target handle becomes source handle from target's perspective
            source_handle,  # source handle becomes target handle from target's perspective
        )

        # Add edge_id to issues
        issues.extend(
            ValidationIssue(**{**issue.model_dump(), "edgeId": edge_id})
            for issue in node_issues
        )

        return issues

