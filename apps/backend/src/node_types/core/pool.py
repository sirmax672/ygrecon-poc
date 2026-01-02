"""Pool node type - stores resources."""

from typing import Optional
from ..base import NodeType
from ...shared.dsl_schema import GraphDSL, ValidationIssue


class PoolNodeType(NodeType):
    """Pool node type: can have both inputs and outputs (no restrictions)."""

    def __init__(self):
        super().__init__("core.Pool")

    def validate_connection(
        self,
        graph: GraphDSL,
        from_node_id: str,
        to_node_id: str,
        source_handle: Optional[str] = None,
        target_handle: Optional[str] = None,
    ) -> list[ValidationIssue]:
        """Pool nodes can connect to/from any node type (no restrictions)."""
        return []

