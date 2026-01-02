"""Edge instance class for validation."""

from typing import Optional
from ..shared.dsl_schema import EdgeDef, ValidationIssue


def normalize_handle_id(handle_id: Optional[str]) -> Optional[str]:
    """Normalize handle ID - remove -target suffix if present."""
    if not handle_id:
        return None
    # Remove -target suffix if present (e.g., "top-1-target" -> "top-1")
    return handle_id.replace("-target", "")


class EdgeInstance:
    """Represents an edge instance in the graph with validation capabilities."""

    def __init__(self, edge_def: EdgeDef, existing_edges: list):
        """
        Initialize edge instance.

        Args:
            edge_def: The edge definition
            existing_edges: List of existing edges in the graph (for duplicate checks)
        """
        self.edge_def = edge_def
        self.existing_edges = existing_edges

    def validate_structure(self) -> list[ValidationIssue]:
        """
        Validate base structural rules for this edge.

        Checks:
        - No duplicate connections in the same direction
        - No reverse connection on the same handles

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
                for e in self.existing_edges
                if e.id != self.edge_def.id
                and e.from_ == self.edge_def.from_
                and e.to == self.edge_def.to
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
                    for e in self.existing_edges
                    if e.id != self.edge_def.id
                    and e.from_ == self.edge_def.to
                    and e.to == self.edge_def.from_
                    and normalize_handle_id(e.params.get("sourceHandle"))
                    == target_handle
                    and normalize_handle_id(e.params.get("targetHandle"))
                    == source_handle
                ),
                None,
            )

            if reverse:
                issues.append(
                    ValidationIssue(
                        code="REVERSE_CONNECTION_ON_SAME_HANDLES",
                        message=f"Cannot create reverse connection {self.edge_def.from_}[{source_handle}]->{self.edge_def.to}[{target_handle}] because reverse connection {reverse.id} already exists on the same handles.",
                        edgeId=self.edge_def.id,
                        nodeId=self.edge_def.from_,
                    )
                )

        return issues

