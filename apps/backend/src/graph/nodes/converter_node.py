"""Converter node instance - transforms resources."""

from typing import Optional
from ...shared.dsl_schema import ValidationIssue
from .base_node import NodeInstance


class ConverterNode(NodeInstance):
    """Converter node: can have both incoming and outgoing edges."""

    # No additional validation needed - converters accept all connections
    pass

