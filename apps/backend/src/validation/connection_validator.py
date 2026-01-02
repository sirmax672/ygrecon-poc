"""Connection validation logic ported from TypeScript."""

from typing import Optional
from ..shared.dsl_schema import GraphDSL, ValidationIssue, EdgeDef
from ..node_types.core import get_node_type


def normalize_handle_id(handle_id: Optional[str]) -> Optional[str]:
    """Normalize handle ID - remove -target suffix if present."""
    if not handle_id:
        return None
    # Remove -target suffix if present (e.g., "top-1-target" -> "top-1")
    return handle_id.replace("-target", "")


def get_edge_handles(edge: EdgeDef) -> dict[str, Optional[str]]:
    """Extract handle IDs from edge params."""
    source_handle = normalize_handle_id(edge.params.get("sourceHandle"))
    target_handle = normalize_handle_id(edge.params.get("targetHandle"))
    return {"sourceHandle": source_handle, "targetHandle": target_handle}


def validate_connections(dsl: GraphDSL) -> list[ValidationIssue]:
    """
    Validate all edge connections in a graph.

    Performs base-level structural checks and delegates node-type-specific
    validation to node type classes.

    Args:
        dsl: The graph DSL to validate

    Returns:
        List of validation issues (empty if all valid)
    """
    issues: list[ValidationIssue] = []
    node_map = {node.id: node for node in dsl.nodes}
    edges_by_direction: dict[str, list[EdgeDef]] = {}  # "from->to" -> edges[]
    edges_by_handles: dict[str, EdgeDef] = {}  # "from[handleX]->to[handleY]" -> edge

    # Build edge maps and validate base rules
    for edge in dsl.edges:
        # Skip if nodes don't exist (this should be checked elsewhere)
        if edge.from_ not in node_map or edge.to not in node_map:
            continue

        direction_key = f"{edge.from_}->{edge.to}"
        handles = get_edge_handles(edge)
        source_handle = handles["sourceHandle"]
        target_handle = handles["targetHandle"]

        # Rule 1: No duplicate connections in the same direction
        if direction_key not in edges_by_direction:
            edges_by_direction[direction_key] = []
        existing_in_direction = edges_by_direction[direction_key]

        # Check if this edge is a duplicate (same from->to, regardless of handles)
        is_duplicate = any(
            e.id != edge.id and e.from_ == edge.from_ and e.to == edge.to
            for e in existing_in_direction
        )

        if is_duplicate:
            issues.append(
                ValidationIssue(
                    code="DUPLICATE_CONNECTION",
                    message=f"Duplicate connection from {edge.from_} to {edge.to}. Only one edge allowed per direction.",
                    edgeId=edge.id,
                    nodeId=edge.from_,
                )
            )
        else:
            existing_in_direction.append(edge)

        # Rule 2: No reverse connection using the same handles
        if source_handle and target_handle:
            handle_key = f"{edge.from_}[{source_handle}]->{edge.to}[{target_handle}]"
            reverse_handle_key = f"{edge.to}[{target_handle}]->{edge.from_}[{source_handle}]"

            if reverse_handle_key in edges_by_handles:
                reverse_edge = edges_by_handles[reverse_handle_key]
                issues.append(
                    ValidationIssue(
                        code="REVERSE_CONNECTION_ON_SAME_HANDLES",
                        message=f"Cannot create reverse connection {edge.from_}[{source_handle}]->{edge.to}[{target_handle}] because reverse connection {reverse_edge.id} already exists on the same handles.",
                        edgeId=edge.id,
                        nodeId=edge.from_,
                    )
                )
            else:
                edges_by_handles[handle_key] = edge

    # Delegate to node-type-specific validation
    for edge in dsl.edges:
        if edge.from_ not in node_map or edge.to not in node_map:
            continue

        from_node = node_map[edge.from_]
        to_node = node_map[edge.to]
        handles = get_edge_handles(edge)
        source_handle = handles["sourceHandle"]
        target_handle = handles["targetHandle"]

        # Validate from node's perspective
        from_node_type = get_node_type(from_node.type)
        if from_node_type:
            node_issues = from_node_type.validate_connection(
                dsl, edge.from_, edge.to, source_handle, target_handle
            )
            issues.extend(
                ValidationIssue(**{**issue.model_dump(), "edgeId": edge.id})
                for issue in node_issues
            )

        # Validate to node's perspective (for incoming connections)
        to_node_type = get_node_type(to_node.type)
        if to_node_type:
            # For incoming validation, we swap from/to to represent the connection from the target's perspective
            node_issues = to_node_type.validate_connection(
                dsl, edge.to, edge.from_, target_handle, source_handle
            )
            issues.extend(
                ValidationIssue(**{**issue.model_dump(), "edgeId": edge.id})
                for issue in node_issues
            )

    return issues

