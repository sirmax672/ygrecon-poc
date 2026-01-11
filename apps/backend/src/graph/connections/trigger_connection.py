"""Trigger Connection instance - activates nodes when conditions are met."""

from typing import Optional
from ...shared.dsl_schema import ConnectionDef, ValidationIssue, ConnectionVisual
from ..connection_instance import ConnectionInstance
from .params_models import TriggerConnectionParams


class TriggerConnection(ConnectionInstance):
    """Trigger Connection: activates a node when certain conditions are met."""

    # Typed attributes
    trigger_condition: str
    effect: Optional[str] = None

    def __init__(self, connection_def: ConnectionDef):
        """Initialize Trigger Connection from ConnectionDef."""
        super().__init__(connection_def)
        
        params = connection_def.params or {}
        try:
            validated_params = TriggerConnectionParams(**params)
        except Exception as e:
            raise ValueError(f"Invalid TriggerConnection params for connection {connection_def.id}: {e}")
        
        self.trigger_condition = validated_params.trigger_condition
        self.effect = validated_params.effect

    def to_connection_def(self) -> ConnectionDef:
        """Convert instance back to ConnectionDef for serialization."""
        params = {"triggerCondition": self.trigger_condition}
        if self.effect is not None:
            params["effect"] = self.effect
        
        visual_dict = self.visual.model_dump() if hasattr(self.visual, 'model_dump') else {
            "source_handle": self.visual.source_handle,
            "target_handle": self.visual.target_handle,
            "points": self.visual.points,
            "color": self.visual.color,
            "style": self.visual.style,
        }
        
        return ConnectionDef(
            id=self.id,
            type="trigger",
            from_=self.from_node_id,
            to=self.to_node_id,
            params=params,
            visual=ConnectionVisual(**visual_dict),
        )
