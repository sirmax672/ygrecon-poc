"""Core node type implementations."""

from .source import SourceNodeType
from .pool import PoolNodeType
from .drain import DrainNodeType
from .gate import GateNodeType
from .converter import ConverterNodeType
from .trader import TraderNodeType
from .random_split import RandomSplitNodeType

# Registry of core node types
NODE_TYPE_REGISTRY = {
    "core.Source": SourceNodeType(),
    "core.Pool": PoolNodeType(),
    "core.Drain": DrainNodeType(),
    "core.Gate": GateNodeType(),
    "core.Converter": ConverterNodeType(),
    "core.Trader": TraderNodeType(),
    "core.RandomSplit": RandomSplitNodeType(),
}


def get_node_type(type_id: str):
    """Get node type instance by type ID."""
    return NODE_TYPE_REGISTRY.get(type_id)

