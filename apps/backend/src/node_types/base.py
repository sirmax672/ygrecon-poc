"""Base node type interface."""

from typing import Optional
from ..shared.dsl_schema import GraphDSL, ValidationIssue


class NodeType:
    """Base class for node type implementations."""

    def __init__(self, type_id: str):
        self.type_id = type_id

    def validate_connection(
        self,
        graph: GraphDSL,
        from_node_id: str,
        to_node_id: str,
        source_handle: Optional[str] = None,
        target_handle: Optional[str] = None,
    ) -> list[ValidationIssue]:
        """
        Validate if a connection can be made.

        Args:
            graph: The full graph DSL
            from_node_id: Source node ID
            to_node_id: Target node ID
            source_handle: Source handle ID (optional)
            target_handle: Target handle ID (optional)

        Returns:
            List of validation issues (empty if valid)
        """
        return []

