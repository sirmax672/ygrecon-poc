"""Source node instance - generates resources."""

from typing import Optional
from ...shared.dsl_schema import ValidationIssue
from .base_node import NodeInstance


class SourceNode(NodeInstance):
    """Source node: cannot have incoming edges."""

    def validate_incoming_connection(
        self,
        from_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: str,
    ) -> list[ValidationIssue]:
        """Source nodes cannot have incoming edges."""
        issues: list[ValidationIssue] = []

        issues.append(
            ValidationIssue(
                code="INVALID_SOURCE_INPUT",
                message="Source nodes cannot have incoming edges. They only generate resources.",
                nodeId=self.node_def.id,
                edgeId=edge_id,
            )
        )

        return issues

