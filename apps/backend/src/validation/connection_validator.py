"""Connection validation logic for batch validation."""

from ..shared.dsl_schema import ValidationIssue
from ..graph.connection_instance import normalize_handle_id
from ..graph.graph import Graph


def validate_connections(graph: Graph) -> list[ValidationIssue]:
    """
    Validate all connections in a graph.

    Performs base-level structural checks and delegates node-type-specific
    validation to node instance classes.

    Args:
        graph: The Graph object to validate

    Returns:
        List of validation issues (empty if all valid)
    """
    issues: list[ValidationIssue] = []
    node_map = {node.id: node for node in graph.nodes}

    # Validate each connection
    for connection_instance in graph.connections:
        # Skip if nodes don't exist (this should be checked elsewhere)
        if connection_instance.from_node_id not in node_map or connection_instance.to_node_id not in node_map:
            continue

        # 1. Validate connection structure (duplicates, reverse connections)
        structure_issues = connection_instance.validate_structure(graph)
        issues.extend(structure_issues)

        # 2. Validate node-type-specific connections
        if not structure_issues:  # Only check node types if structure is valid
            from_node_instance = node_map[connection_instance.from_node_id]
            to_node_instance = node_map[connection_instance.to_node_id]

            source_handle = normalize_handle_id(connection_instance.visual.source_handle)
            target_handle = normalize_handle_id(connection_instance.visual.target_handle)

            # Validate from node's perspective (outgoing connection)
            node_issues = from_node_instance.validate_connection(
                graph,
                connection_instance.from_node_id,
                connection_instance.to_node_id,
                source_handle,
                target_handle,
                connection_instance.id,
            )
            issues.extend(node_issues)

            # Validate to node's perspective (incoming connection)
            if not node_issues:  # Only check if previous validation passed
                node_issues = to_node_instance.validate_connection(
                    graph,
                    connection_instance.from_node_id,
                    connection_instance.to_node_id,
                    source_handle,
                    target_handle,
                    connection_instance.id,
                )
                issues.extend(node_issues)

    return issues

