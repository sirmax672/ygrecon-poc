"""Connection validation logic for batch validation."""

from ..shared.dsl_schema import ValidationIssue
from ..graph.edge_instance import normalize_handle_id
from ..graph.graph import Graph


def validate_connections(graph: Graph) -> list[ValidationIssue]:
    """
    Validate all edge connections in a graph.

    Performs base-level structural checks and delegates node-type-specific
    validation to node instance classes.

    Args:
        graph: The Graph object to validate

    Returns:
        List of validation issues (empty if all valid)
    """
    issues: list[ValidationIssue] = []
    node_map = {node.node_def.id: node for node in graph.nodes}

    # Validate each edge
    for edge_instance in graph.edges:
        edge_def = edge_instance.edge_def

        # Skip if nodes don't exist (this should be checked elsewhere)
        if edge_def.from_ not in node_map or edge_def.to not in node_map:
            continue

        # 1. Validate edge structure (duplicates, reverse connections)
        structure_issues = edge_instance.validate_structure(graph)
        issues.extend(structure_issues)

        # 2. Validate node-type-specific connections
        if not structure_issues:  # Only check node types if structure is valid
            from_node_instance = node_map[edge_def.from_]
            to_node_instance = node_map[edge_def.to]

            source_handle = normalize_handle_id(edge_def.params.get("sourceHandle"))
            target_handle = normalize_handle_id(edge_def.params.get("targetHandle"))

            # Validate from node's perspective (outgoing connection)
            node_issues = from_node_instance.validate_connection(
                graph,
                edge_def.from_,
                edge_def.to,
                source_handle,
                target_handle,
                edge_def.id,
            )
            issues.extend(node_issues)

            # Validate to node's perspective (incoming connection)
            if not node_issues:  # Only check if previous validation passed
                node_issues = to_node_instance.validate_connection(
                    graph,
                    edge_def.from_,
                    edge_def.to,
                    source_handle,
                    target_handle,
                    edge_def.id,
                )
                issues.extend(node_issues)

    return issues

