"""Drain node type - consumes resources."""

from typing import Optional
from ..base import NodeType
from ...shared.dsl_schema import GraphDSL, ValidationIssue


class DrainNodeType(NodeType):
    """Drain node type: cannot have outgoing edges."""

    def __init__(self):
        super().__init__("core.Drain")

    def validate_connection(
        self,
        graph: GraphDSL,
        from_node_id: str,
        to_node_id: str,
        source_handle: Optional[str] = None,
        target_handle: Optional[str] = None,
    ) -> list[ValidationIssue]:
        """Drain nodes cannot have outgoing edges."""
        issues = []

        # When validating from source's perspective (outgoing connection),
        # from_node_id is the source node (the one sending the connection)
        # Check if the source node is a Drain
        for node in graph.nodes:
            if node.id == from_node_id and node.type == "core.Drain":
                issues.append(
                    ValidationIssue(
                        code="INVALID_DRAIN_OUTPUT",
                        message="Drain nodes cannot have outgoing edges. They only consume resources.",
                        nodeId=from_node_id,
                    )
                )

        return issues

