"""Drain node instance - consumes resources."""

from typing import Optional, Literal
from ...shared.dsl_schema import NodeDef, ValidationIssue
from .base_node import NodeInstance
from .params_models import DrainParams


class DrainNode(NodeInstance):
    """Drain node: cannot have outgoing edges."""

    # Typed attributes
    resource_id: Optional[str] = None
    consumption_rate: Optional[float] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["pull-any"]] = None

    def __init__(self, node_def: NodeDef):
        """Initialize Drain node from NodeDef."""
        super().__init__(node_def)
        
        params = node_def.params or {}
        try:
            validated_params = DrainParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid Drain params for node {node_def.id}: {e}")
        
        self.resource_id = validated_params.resource_id
        self.consumption_rate = validated_params.consumption_rate
        self.activation = validated_params.activation
        self.activation_mode = validated_params.activation_mode

    def to_node_def(self) -> NodeDef:
        """Convert instance back to NodeDef for serialization."""
        params = {}
        if self.resource_id is not None:
            params["resourceId"] = self.resource_id
        if self.consumption_rate is not None:
            params["consumptionRate"] = self.consumption_rate
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

    def validate_outgoing_connection(
        self,
        to_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: Optional[str],
    ) -> list[ValidationIssue]:
        """Drain nodes cannot have outgoing edges."""
        issues: list[ValidationIssue] = []

        issues.append(
            ValidationIssue(
                code="INVALID_DRAIN_OUTPUT",
                message="Drain nodes cannot have outgoing edges. They only consume resources.",
                nodeId=self.id,
                edgeId=edge_id,
            )
        )

        return issues
