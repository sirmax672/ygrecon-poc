"""Edge instance class for validation."""

from typing import Optional, TYPE_CHECKING
from ..shared.dsl_schema import EdgeDef, ValidationIssue

if TYPE_CHECKING:
    from .graph import Graph


def normalize_handle_id(handle_id: Optional[str]) -> Optional[str]:
    """Normalize handle ID - remove -target suffix if present."""
    if not handle_id:
        return None
    # Remove -target suffix if present (e.g., "top-1-target" -> "top-1")
    return handle_id.replace("-target", "")


class EdgeInstance:
    """Represents an edge instance in the graph with validation capabilities."""

    def __init__(self, edge_def: EdgeDef):
        """
        Initialize edge instance.

        Args:
            edge_def: The edge definition
        """
        self.edge_def = edge_def

    def to_edge_def(self) -> EdgeDef:
        """
        Convert instance back to EdgeDef.

        Returns:
            EdgeDef object
        """
        return self.edge_def

    def validate_structure(self, graph: "Graph") -> list[ValidationIssue]:
        """
        Validate base structural rules for this edge.

        Checks:
        - No duplicate connections in the same direction
        - No reverse connection on the same handles

        Args:
            graph: The Graph object (needed to access existing edges)

        Returns:
            List of validation issues
        """
        issues: list[ValidationIssue] = []

        source_handle = normalize_handle_id(
            self.edge_def.params.get("sourceHandle")
        )
        target_handle = normalize_handle_id(
            self.edge_def.params.get("targetHandle")
        )

        # Rule 1: Check for duplicate connection (same from->to)
        duplicate = next(
            (
                e
                for e in graph.edges
                if e.edge_def.id != self.edge_def.id
                and e.edge_def.from_ == self.edge_def.from_
                and e.edge_def.to == self.edge_def.to
            ),
            None,
        )

        if duplicate:
            issues.append(
                ValidationIssue(
                    code="DUPLICATE_CONNECTION",
                    message=f"Duplicate connection from {self.edge_def.from_} to {self.edge_def.to}. Only one edge allowed per direction.",
                    edgeId=self.edge_def.id,
                    nodeId=self.edge_def.from_,
                )
            )

        # Rule 2: Check for reverse connection on same handles
        if source_handle and target_handle:
            reverse = next(
                (
                    e
                    for e in graph.edges
                    if e.edge_def.id != self.edge_def.id
                    and e.edge_def.from_ == self.edge_def.to
                    and e.edge_def.to == self.edge_def.from_
                    and normalize_handle_id(e.edge_def.params.get("sourceHandle"))
                    == target_handle
                    and normalize_handle_id(e.edge_def.params.get("targetHandle"))
                    == source_handle
                ),
                None,
            )

            if reverse:
                issues.append(
                    ValidationIssue(
                        code="REVERSE_CONNECTION_ON_SAME_HANDLES",
                        message=f"Cannot create reverse connection {self.edge_def.from_}[{source_handle}]->{self.edge_def.to}[{target_handle}] because reverse connection {reverse.edge_def.id} already exists on the same handles.",
                        edgeId=self.edge_def.id,
                        nodeId=self.edge_def.from_,
                    )
                )

        return issues

