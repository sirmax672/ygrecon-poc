"""Resource Connection instance - moves resources between nodes."""

from typing import Optional, Literal
from ...shared.dsl_schema import ConnectionDef, ValidationIssue, ConnectionVisual
from ..connection_instance import ConnectionInstance
from .params_models import ResourceConnectionParams


class ResourceConnection(ConnectionInstance):
    """Resource Connection: defines how resources flow between nodes."""

    # Typed attributes
    batch: Optional[float] = None
    weight: Optional[float] = None
    label: Optional[str] = None
    condition: Optional[str] = None
    interval: Optional[float] = None
    transfer: Optional[Literal["interval-based", "pull-any", "push-any"]] = None
    out_resource_id: Optional[str] = None
    color_coding: Optional[bool] = None
    color_coding_color: Optional[str] = None
    shuffle_source: Optional[bool] = None
    limits_min: Optional[float] = None
    limits_max: Optional[float] = None

    def __init__(self, connection_def: ConnectionDef):
        """Initialize Resource Connection from ConnectionDef."""
        super().__init__(connection_def)
        
        params = connection_def.params or {}
        try:
            validated_params = ResourceConnectionParams(**params)
        except Exception as e:
            raise ValueError(f"Invalid ResourceConnection params for connection {connection_def.id}: {e}")
        
        self.batch = validated_params.batch
        self.weight = validated_params.weight
        self.label = validated_params.label
        self.condition = validated_params.condition
        self.interval = validated_params.interval
        self.transfer = validated_params.transfer
        self.out_resource_id = validated_params.out_resource_id
        self.color_coding = validated_params.color_coding
        self.color_coding_color = validated_params.color_coding_color
        self.shuffle_source = validated_params.shuffle_source
        self.limits_min = validated_params.limits_min
        self.limits_max = validated_params.limits_max

    def to_connection_def(self) -> ConnectionDef:
        """Convert instance back to ConnectionDef for serialization."""
        params = {}
        if self.batch is not None:
            params["batch"] = self.batch
        if self.weight is not None:
            params["weight"] = self.weight
        if self.label is not None:
            params["label"] = self.label
        if self.condition is not None:
            params["condition"] = self.condition
        if self.interval is not None:
            params["interval"] = self.interval
        if self.transfer is not None:
            params["transfer"] = self.transfer
        if self.out_resource_id is not None:
            params["outResourceId"] = self.out_resource_id
        if self.color_coding is not None:
            params["colorCoding"] = self.color_coding
        if self.color_coding_color is not None:
            params["colorCodingColor"] = self.color_coding_color
        if self.shuffle_source is not None:
            params["shuffleSource"] = self.shuffle_source
        if self.limits_min is not None:
            params["limitsMin"] = self.limits_min
        if self.limits_max is not None:
            params["limitsMax"] = self.limits_max
        
        # Ensure handles are in visual, not params
        visual_dict = self.visual.model_dump() if hasattr(self.visual, 'model_dump') else {
            "source_handle": self.visual.source_handle,
            "target_handle": self.visual.target_handle,
            "points": self.visual.points,
            "color": self.visual.color,
            "style": self.visual.style,
        }
        
        return ConnectionDef(
            id=self.id,
            type="resource",
            from_=self.from_node_id,
            to=self.to_node_id,
            params=params,
            visual=ConnectionVisual(**visual_dict),
        )
