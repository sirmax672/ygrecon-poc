"""State Connection instance - changes state of nodes or edges."""

from typing import Optional
from ...shared.dsl_schema import ConnectionDef, ValidationIssue, ConnectionVisual
from ..connection_instance import ConnectionInstance
from .params_models import StateConnectionParams


class StateConnection(ConnectionInstance):
    """State Connection: transmits state information rather than resources."""

    # Typed attributes
    condition: Optional[str] = None
    effect: Optional[str] = None
    target_property: Optional[str] = None
    trigger_on: Optional[str] = None
    color_coding: Optional[bool] = None
    color_coding_color: Optional[str] = None

    def __init__(self, connection_def: ConnectionDef):
        """Initialize State Connection from ConnectionDef."""
        super().__init__(connection_def)
        
        params = connection_def.params or {}
        try:
            validated_params = StateConnectionParams(**params)
        except Exception as e:
            raise ValueError(f"Invalid StateConnection params for connection {connection_def.id}: {e}")
        
        self.condition = validated_params.condition
        self.effect = validated_params.effect
        self.target_property = validated_params.target_property
        self.trigger_on = validated_params.trigger_on
        self.color_coding = validated_params.color_coding
        self.color_coding_color = validated_params.color_coding_color

    def to_connection_def(self) -> ConnectionDef:
        """Convert instance back to ConnectionDef for serialization."""
        params = {}
        if self.condition is not None:
            params["condition"] = self.condition
        if self.effect is not None:
            params["effect"] = self.effect
        if self.target_property is not None:
            params["targetProperty"] = self.target_property
        if self.trigger_on is not None:
            params["triggerOn"] = self.trigger_on
        if self.color_coding is not None:
            params["colorCoding"] = self.color_coding
        if self.color_coding_color is not None:
            params["colorCodingColor"] = self.color_coding_color
        
        visual_dict = self.visual.model_dump() if hasattr(self.visual, 'model_dump') else {
            "source_handle": self.visual.source_handle,
            "target_handle": self.visual.target_handle,
            "points": self.visual.points,
            "color": self.visual.color,
            "style": self.visual.style,
        }
        
        return ConnectionDef(
            id=self.id,
            type="state",
            from_=self.from_node_id,
            to=self.to_node_id,
            params=params,
            visual=ConnectionVisual(**visual_dict),
        )
