"""Gate node instance - conditional flow control."""

from typing import Optional
from ...shared.dsl_schema import ValidationIssue
from .base_node import NodeInstance


class GateNode(NodeInstance):
    """Gate node: can have both incoming and outgoing edges."""

    # No additional validation needed - gates accept all connections
    pass

