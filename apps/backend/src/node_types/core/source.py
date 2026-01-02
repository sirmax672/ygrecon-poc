"""Source node type - generates resources."""

from typing import Optional
from ..base import NodeType
from ...shared.dsl_schema import GraphDSL, ValidationIssue


class SourceNodeType(NodeType):
    """Source node type: cannot have incoming edges."""

    def __init__(self):
        super().__init__("core.Source")

    def validate_connection(
        self,
        graph: GraphDSL,
        from_node_id: str,
        to_node_id: str,
        source_handle: Optional[str] = None,
        target_handle: Optional[str] = None,
    ) -> list[ValidationIssue]:
        """Source nodes cannot have incoming edges."""
        issues = []

        # When validating from target's perspective (incoming connection),
        # from_node_id is the target node (the one receiving the connection)
        # Check if the target node is a Source
        for node in graph.nodes:
            if node.id == to_node_id and node.type == "core.Source":
                issues.append(
                    ValidationIssue(
                        code="INVALID_SOURCE_INPUT",
                        message="Source nodes cannot have incoming edges. They only generate resources.",
                        nodeId=to_node_id,
                    )
                )

        return issues

