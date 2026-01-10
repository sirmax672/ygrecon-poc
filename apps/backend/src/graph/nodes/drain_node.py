"""Drain node instance - consumes resources."""

from typing import Optional
from ...shared.dsl_schema import ValidationIssue
from .base_node import NodeInstance


class DrainNode(NodeInstance):
    """Drain node: cannot have outgoing edges."""

    def validate_outgoing_connection(
        self,
        to_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: Optional[str],
    ) -> list[ValidationIssue]:
        """Drain nodes cannot have outgoing edges."""
        issues: list[ValidationIssue] = []

        issues.append(
            ValidationIssue(
                code="INVALID_DRAIN_OUTPUT",
                message="Drain nodes cannot have outgoing edges. They only consume resources.",
                nodeId=self.node_def.id,
                edgeId=edge_id,
            )
        )

        return issues

