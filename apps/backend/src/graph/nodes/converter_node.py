"""Converter node instance - transforms resources."""

from typing import Optional, Literal
from ...shared.dsl_schema import NodeDef, ValidationIssue
from .base_node import NodeInstance
from .params_models import ConverterParams


class ConverterNode(NodeInstance):
    """Converter node: can have both incoming and outgoing edges."""

    # Typed attributes
    input_resource_id: str
    output_resource_id: str
    conversion_rate: float
    conversion: Optional[Literal["single", "batch"]] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["pull-any"]] = None
    resource_color: Optional[str] = None

    def __init__(self, node_def: NodeDef):
        """Initialize Converter node from NodeDef."""
        super().__init__(node_def)
        
        params = node_def.params or {}
        # Handle missing required fields for backward compatibility with old data
        if "inputResourceId" not in params and "input_resource_id" not in params:
            params["inputResourceId"] = "default"
        if "outputResourceId" not in params and "output_resource_id" not in params:
            params["outputResourceId"] = "default"
        if "conversionRate" not in params and "conversion_rate" not in params:
            params["conversionRate"] = 1.0
        
        try:
            validated_params = ConverterParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid Converter params for node {node_def.id}: {e}")
        
        self.input_resource_id = validated_params.input_resource_id
        self.output_resource_id = validated_params.output_resource_id
        self.conversion_rate = validated_params.conversion_rate
        self.conversion = validated_params.conversion
        self.activation = validated_params.activation
        self.activation_mode = validated_params.activation_mode
        self.resource_color = validated_params.resource_color

    def to_node_def(self) -> NodeDef:
        """Convert instance back to NodeDef for serialization."""
        params = {
            "inputResourceId": self.input_resource_id,
            "outputResourceId": self.output_resource_id,
            "conversionRate": self.conversion_rate,
        }
        if self.conversion is not None:
            params["conversion"] = self.conversion
        if self.activation is not None:
            params["activation"] = self.activation
        if self.activation_mode is not None:
            params["activationMode"] = self.activation_mode
        if self.resource_color is not None:
            params["resourceColor"] = self.resource_color
        
        return NodeDef(
            id=self.id,
            type=self.type,
            params=params,
            visual=self.visual,
        )

    # No additional validation needed - converters accept all connections
    pass
