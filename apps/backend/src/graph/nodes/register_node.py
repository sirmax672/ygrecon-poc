"""Register node instance - stores numeric values."""

from typing import Optional
from ...shared.dsl_schema import NodeDef, ValidationIssue
from .base_node import NodeInstance
from .params_models import RegisterParams


class RegisterNode(NodeInstance):
    """Register node: stores and manages numeric values that can be modified by formulas or connections."""

    # Typed attributes
    formula: Optional[str] = None
    interactive: Optional[bool] = None
    initial: Optional[float] = None
    step: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    show_in_chart: Optional[bool] = None
    force_update_each_step: Optional[bool] = None

    def __init__(self, node_def: NodeDef):
        """Initialize Register node from NodeDef."""
        super().__init__(node_def)
        
        params = node_def.params or {}
        try:
            validated_params = RegisterParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid Register params for node {node_def.id}: {e}")
        
        self.formula = validated_params.formula
        self.interactive = validated_params.interactive
        self.initial = validated_params.initial
        self.step = validated_params.step
        self.min = validated_params.min
        self.max = validated_params.max
        self.show_in_chart = validated_params.show_in_chart
        self.force_update_each_step = validated_params.force_update_each_step

    def to_node_def(self) -> NodeDef:
        """Convert instance back to NodeDef for serialization."""
        params = {}
        if self.formula is not None:
            params["formula"] = self.formula
        if self.interactive is not None:
            params["interactive"] = self.interactive
        if self.initial is not None:
            params["initial"] = self.initial
        if self.step is not None:
            params["step"] = self.step
        if self.min is not None:
            params["min"] = self.min
        if self.max is not None:
            params["max"] = self.max
        if self.show_in_chart is not None:
            params["showInChart"] = self.show_in_chart
        if self.force_update_each_step is not None:
            params["forceUpdateEachStep"] = self.force_update_each_step
        
        return NodeDef(
            id=self.id,
            type=self.type,
            params=params,
            visual=self.visual,
        )

    # No additional validation needed for now
    pass
