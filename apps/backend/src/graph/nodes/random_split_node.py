"""RandomSplit node instance - splits resources randomly."""

from typing import Optional
from ...shared.dsl_schema import ValidationIssue
from .base_node import NodeInstance


class RandomSplitNode(NodeInstance):
    """RandomSplit node: can have both incoming and outgoing edges."""

    # No additional validation needed - random splits accept all connections
    pass

