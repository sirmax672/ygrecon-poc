"""Graph container class for in-memory representation."""

from typing import TYPE_CHECKING
from ..shared.dsl_schema import GraphDSL, GraphMeta, ResourceDef, NodeDef, ConnectionDef

if TYPE_CHECKING:
    from .nodes.base_node import NodeInstance
    from .connection_instance import ConnectionInstance
else:
    NodeInstance = None
    ConnectionInstance = None


class Graph:
    """In-memory graph representation with node and connection instances."""

    def __init__(
        self,
        meta: GraphMeta,
        resources: list[ResourceDef],
        nodes: list["NodeInstance"],
        connections: list["ConnectionInstance"],
    ):
        """
        Initialize graph with instances.

        Args:
            meta: Graph metadata (name, seed, etc.)
            resources: List of resource definitions
            nodes: List of NodeInstance objects
            connections: List of ConnectionInstance objects
        """
        self.meta = meta
        self.resources = resources
        self.nodes = nodes  # List[NodeInstance]
        self.connections = connections  # List[ConnectionInstance] (renamed from edges)

    def to_dsl(self) -> GraphDSL:
        """
        Generate DSL representation from instances.

        Returns:
            GraphDSL object with current state
        """
        # Convert NodeInstance -> NodeDef
        node_defs = [node.to_node_def() for node in self.nodes]

        # Convert ConnectionInstance -> ConnectionDef
        connection_defs = [conn.to_connection_def() for conn in self.connections]

        return GraphDSL(
            dslVersion="0.2",
            meta=self.meta,
            resources=self.resources,
            nodes=node_defs,
            connections=connection_defs,
        )

    @classmethod
    def from_dsl(cls, dsl: GraphDSL) -> "Graph":
        """
        Create Graph from DSL (used when loading from DB).
        Handles migration from old "edges" to new "connections" format.

        Args:
            dsl: GraphDSL object to convert

        Returns:
            Graph instance with NodeInstance and ConnectionInstance objects
        """
        from .nodes import create_node_instance
        from .connections import create_connection_instance

        # Convert NodeDef -> NodeInstance
        node_instances = [
            create_node_instance(node_def) for node_def in dsl.nodes
        ]

        # Convert ConnectionDef -> ConnectionInstance
        # Handle migration: if edges exist but connections don't, migrate them
        connection_defs = list(dsl.connections) if dsl.connections else []
        if not connection_defs and dsl.edges:
            # Migrate old edges to connections with default type "resource"
            from ...shared.dsl_schema import ConnectionVisual
            connection_defs = []
            for edge in dsl.edges:
                # Create ConnectionDef from Edge (backward compatibility)
                # dsl.edges might be ConnectionDef objects already, or dict-like
                if isinstance(edge, ConnectionDef):
                    # Already a ConnectionDef, just set default type if missing
                    if not edge.type or edge.type == "":
                        edge.type = "resource"
                    connection_defs.append(edge)
                else:
                    # Legacy edge format - migrate to ConnectionDef
                    edge_dict = edge if isinstance(edge, dict) else edge.model_dump() if hasattr(edge, 'model_dump') else {}
                    edge_params = edge_dict.get("params", {})
                    visual_data = {}
                    
                    # Check for visual in edge_dict or as attribute
                    if "visual" in edge_dict and edge_dict["visual"]:
                        visual_obj = edge_dict["visual"]
                        if hasattr(visual_obj, 'model_dump'):
                            visual_data = visual_obj.model_dump()
                        elif isinstance(visual_obj, dict):
                            visual_data = visual_obj
                    elif hasattr(edge, 'visual') and edge.visual:
                        visual_obj = edge.visual
                        visual_data = visual_obj.model_dump() if hasattr(visual_obj, 'model_dump') else {
                            "source_handle": getattr(visual_obj, 'source_handle', None),
                            "target_handle": getattr(visual_obj, 'target_handle', None),
                            "points": getattr(visual_obj, 'points', []),
                            "color": getattr(visual_obj, 'color', None),
                            "style": getattr(visual_obj, 'style', None),
                        }
                    else:
                        # Migrate handles from params (backward compatibility)
                        if edge_params.get("sourceHandle"):
                            visual_data["source_handle"] = edge_params.get("sourceHandle")
                        if edge_params.get("targetHandle"):
                            visual_data["target_handle"] = edge_params.get("targetHandle")
                        if edge_params.get("points"):
                            visual_data["points"] = edge_params.get("points")
                    
                    # Remove visual properties from params (they go to visual)
                    connection_params = {k: v for k, v in edge_params.items() 
                                       if k not in ["sourceHandle", "targetHandle", "points"]}
                    
                    connection_def = ConnectionDef(
                        id=edge_dict.get("id", ""),
                        type="resource",  # Default type for migrated edges
                        from_=edge_dict.get("from") or edge_dict.get("from_", ""),
                        to=edge_dict.get("to", ""),
                        params=connection_params,
                        visual=ConnectionVisual(**visual_data) if visual_data else None,
                    )
                    connection_defs.append(connection_def)
        
        connection_instances = [
            create_connection_instance(conn_def) for conn_def in connection_defs
        ]

        return cls(
            meta=dsl.meta,
            resources=dsl.resources,
            nodes=node_instances,
            connections=connection_instances,
        )
