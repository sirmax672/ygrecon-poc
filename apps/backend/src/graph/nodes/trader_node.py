"""Trader node instance - exchanges resources."""

from typing import Optional
from ...shared.dsl_schema import ValidationIssue
from .base_node import NodeInstance


class TraderNode(NodeInstance):
    """Trader node: can have both incoming and outgoing edges."""

    # No additional validation needed - traders accept all connections
    pass

