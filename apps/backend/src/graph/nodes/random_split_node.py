"""RandomSplit node instance - splits resources randomly."""

from typing import Optional, Literal
from ...shared.dsl_schema import NodeDef, ValidationIssue
from .base_node import NodeInstance
from .params_models import RandomSplitParams


class RandomSplitNode(NodeInstance):
    """RandomSplit node: can have both incoming and outgoing edges."""

    # Typed attributes
    weights: list[float]
    consume_input: Optional[bool] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["pull-any", "push-all"]] = None

    def __init__(self, node_def: NodeDef):
        """Initialize RandomSplit node from NodeDef."""
        super().__init__(node_def)
        
        params = node_def.params or {}
        # Handle missing required fields for backward compatibility with old data
        if "weights" not in params or not params.get("weights"):
            params["weights"] = [1.0, 1.0]  # Default to equal weights for 2 outputs
        
        try:
            validated_params = RandomSplitParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid RandomSplit params for node {node_def.id}: {e}")
        
        self.weights = validated_params.weights
        self.consume_input = validated_params.consume_input
        self.activation = validated_params.activation
        self.activation_mode = validated_params.activation_mode

    def to_node_def(self) -> NodeDef:
        """Convert instance back to NodeDef for serialization."""
        params = {"weights": self.weights}
        if self.consume_input is not None:
            params["consumeInput"] = self.consume_input
        if self.activation is not None:
            params["activation"] = self.activation
        if self.activation_mode is not None:
            params["activationMode"] = self.activation_mode
        
        return NodeDef(
            id=self.id,
            type=self.type,
            params=params,
            visual=self.visual,
        )

    # No additional validation needed - random splits accept all connections
    pass
