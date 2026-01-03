"""Pool node instance - stores resources."""

from typing import Optional
from ...shared.dsl_schema import ValidationIssue
from .base_node import NodeInstance


class PoolNode(NodeInstance):
    """Pool node: can have both incoming and outgoing edges."""

    # No additional validation needed - pools accept all connections
    pass

