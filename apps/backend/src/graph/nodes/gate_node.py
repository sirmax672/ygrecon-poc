"""Gate node instance - conditional flow control."""

from typing import Optional, Literal
from ...shared.dsl_schema import NodeDef, ValidationIssue
from .base_node import NodeInstance
from .params_models import GateParams


class GateNode(NodeInstance):
    """Gate node: can have both incoming and outgoing edges."""

    # Typed attributes
    distribution: Literal["dice", "deterministic"]
    distribution_mode: Optional[Literal["probabilistic", "deterministic"]] = None
    weights: Optional[list[float]] = None
    condition: Optional[str] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["pull-any", "push-all"]] = None

    def __init__(self, node_def: NodeDef):
        """Initialize Gate node from NodeDef."""
        super().__init__(node_def)
        
        params = node_def.params or {}
        # Handle missing required fields for backward compatibility with old data
        if "distribution" not in params:
            params["distribution"] = "dice"  # Default to dice distribution
        
        try:
            validated_params = GateParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid Gate params for node {node_def.id}: {e}")
        
        self.distribution = validated_params.distribution
        self.distribution_mode = validated_params.distribution_mode
        self.weights = validated_params.weights
        self.condition = validated_params.condition
        self.activation = validated_params.activation
        self.activation_mode = validated_params.activation_mode

    def to_node_def(self) -> NodeDef:
        """Convert instance back to NodeDef for serialization."""
        params = {"distribution": self.distribution}
        if self.distribution_mode is not None:
            params["distributionMode"] = self.distribution_mode
        if self.weights is not None:
            params["weights"] = self.weights
        if self.condition is not None:
            params["condition"] = self.condition
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

    # No additional validation needed - gates accept all connections
    pass
