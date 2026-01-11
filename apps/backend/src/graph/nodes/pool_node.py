"""Pool node instance - stores resources."""

from typing import Optional, Literal
from ...shared.dsl_schema import NodeDef, ValidationIssue, NodeVisual
from .base_node import NodeInstance
from .params_models import PoolParams


class PoolNode(NodeInstance):
    """Pool node: can have both incoming and outgoing edges."""

    # Typed attributes
    resource_id: str
    initial: Optional[float] = None
    capacity: Optional[float] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["push-all", "pull-any", "push-any"]] = None
    overflow: Optional[Literal["block", "allow"]] = None
    show_in_chart: Optional[bool] = None
    resource_color: Optional[str] = None

    def __init__(self, node_def: NodeDef):
        """Initialize Pool node from NodeDef."""
        super().__init__(node_def)
        
        # Extract and validate params
        params = node_def.params or {}
        # Handle missing resourceId for backward compatibility with old data
        if "resourceId" not in params and "resource_id" not in params:
            # Set default resourceId if not provided (for migration of old data)
            params["resourceId"] = "default"
        
        try:
            validated_params = PoolParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid Pool params for node {node_def.id}: {e}")
        
        # Set typed attributes
        self.resource_id = validated_params.resource_id
        self.initial = validated_params.initial
        self.capacity = validated_params.capacity
        self.activation = validated_params.activation
        self.activation_mode = validated_params.activation_mode
        self.overflow = validated_params.overflow
        self.show_in_chart = validated_params.show_in_chart
        self.resource_color = validated_params.resource_color

    def to_node_def(self) -> NodeDef:
        """Convert instance back to NodeDef for serialization."""
        params = {
            "resourceId": self.resource_id,
        }
        if self.initial is not None:
            params["initial"] = self.initial
        if self.capacity is not None:
            params["capacity"] = self.capacity
        if self.activation is not None:
            params["activation"] = self.activation
        if self.activation_mode is not None:
            params["activationMode"] = self.activation_mode
        if self.overflow is not None:
            params["overflow"] = self.overflow
        if self.show_in_chart is not None:
            params["showInChart"] = self.show_in_chart
        if self.resource_color is not None:
            params["resourceColor"] = self.resource_color
        
        return NodeDef(
            id=self.id,
            type=self.type,
            params=params,
            visual=self.visual,
        )

    # No additional validation needed - pools accept all connections
    pass
