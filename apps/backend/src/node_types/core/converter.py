"""Converter node type - transforms resources."""

from typing import Optional
from ..base import NodeType
from ...shared.dsl_schema import GraphDSL, ValidationIssue


class ConverterNodeType(NodeType):
    """Converter node type: can have both inputs and outputs (no restrictions)."""

    def __init__(self):
        super().__init__("core.Converter")

    def validate_connection(
        self,
        graph: GraphDSL,
        from_node_id: str,
        to_node_id: str,
        source_handle: Optional[str] = None,
        target_handle: Optional[str] = None,
    ) -> list[ValidationIssue]:
        """Converter nodes can connect to/from any node type (no restrictions)."""
        return []

