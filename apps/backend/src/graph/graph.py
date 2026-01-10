"""Graph container class for in-memory representation."""

from typing import TYPE_CHECKING
from ..shared.dsl_schema import GraphDSL, GraphMeta, ResourceDef, NodeDef, EdgeDef

if TYPE_CHECKING:
    from .nodes.base_node import NodeInstance
    from .edge_instance import EdgeInstance
else:
    NodeInstance = None
    EdgeInstance = None


class Graph:
    """In-memory graph representation with node and edge instances."""

    def __init__(
        self,
        meta: GraphMeta,
        resources: list[ResourceDef],
        nodes: list["NodeInstance"],
        edges: list["EdgeInstance"],
    ):
        """
        Initialize graph with instances.

        Args:
            meta: Graph metadata (name, seed, etc.)
            resources: List of resource definitions
            nodes: List of NodeInstance objects
            edges: List of EdgeInstance objects
        """
        self.meta = meta
        self.resources = resources
        self.nodes = nodes  # List[NodeInstance]
        self.edges = edges  # List[EdgeInstance]

    def to_dsl(self) -> GraphDSL:
        """
        Generate DSL representation from instances.

        Returns:
            GraphDSL object with current state
        """
        # Convert NodeInstance -> NodeDef
        node_defs = [node.node_def for node in self.nodes]

        # Convert EdgeInstance -> EdgeDef
        edge_defs = [edge.edge_def for edge in self.edges]

        return GraphDSL(
            dslVersion="0.2",
            meta=self.meta,
            resources=self.resources,
            nodes=node_defs,
            edges=edge_defs,
        )

    @classmethod
    def from_dsl(cls, dsl: GraphDSL) -> "Graph":
        """
        Create Graph from DSL (used when loading from DB).

        Args:
            dsl: GraphDSL object to convert

        Returns:
            Graph instance with NodeInstance and EdgeInstance objects
        """
        from .nodes import create_node_instance
        from .edge_instance import EdgeInstance

        # Convert NodeDef -> NodeInstance
        node_instances = [
            create_node_instance(node_def) for node_def in dsl.nodes
        ]

        # Convert EdgeDef -> EdgeInstance
        edge_instances = [EdgeInstance(edge_def) for edge_def in dsl.edges]

        return cls(
            meta=dsl.meta,
            resources=dsl.resources,
            nodes=node_instances,
            edges=edge_instances,
        )
