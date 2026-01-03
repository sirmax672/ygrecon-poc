"""Node instance classes for different node types."""

from .base_node import NodeInstance
from .source_node import SourceNode
from .pool_node import PoolNode
from .drain_node import DrainNode
from .gate_node import GateNode
from .converter_node import ConverterNode
from .trader_node import TraderNode
from .random_split_node import RandomSplitNode

__all__ = [
    "NodeInstance",
    "SourceNode",
    "PoolNode",
    "DrainNode",
    "GateNode",
    "ConverterNode",
    "TraderNode",
    "RandomSplitNode",
    "create_node_instance",
]


def create_node_instance(node_def, graph):
    """
    Factory function to create appropriate node instance based on node type.

    Args:
        node_def: NodeDef instance
        graph: GraphDSL instance

    Returns:
        NodeInstance subclass appropriate for the node type
    """
    node_type = node_def.type

    if node_type == "core.Source":
        return SourceNode(node_def, graph)
    elif node_type == "core.Pool":
        return PoolNode(node_def, graph)
    elif node_type == "core.Drain":
        return DrainNode(node_def, graph)
    elif node_type == "core.Gate":
        return GateNode(node_def, graph)
    elif node_type == "core.Converter":
        return ConverterNode(node_def, graph)
    elif node_type == "core.Trader":
        return TraderNode(node_def, graph)
    elif node_type == "core.RandomSplit":
        return RandomSplitNode(node_def, graph)
    else:
        # Unknown node type - return base NodeInstance
        return NodeInstance(node_def, graph)

