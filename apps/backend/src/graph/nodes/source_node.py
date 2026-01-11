"""Source node instance - generates resources."""

from typing import Optional, Literal
from ...shared.dsl_schema import NodeDef, ValidationIssue
from .base_node import NodeInstance
from .params_models import SourceParams


class SourceNode(NodeInstance):
    """Source node: cannot have incoming edges."""

    # Typed attributes
    resource_id: str
    mode: Optional[Literal["interval", "instant"]] = None
    interval_ms: Optional[float] = None
    amount: Optional[float] = None
    production_rate: Optional[float] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["push-any", "push-all"]] = None
    resource_color: Optional[str] = None

    def __init__(self, node_def: NodeDef):
        """Initialize Source node from NodeDef."""
        super().__init__(node_def)
        
        params = node_def.params or {}
        # Handle missing resourceId for backward compatibility with old data
        if "resourceId" not in params and "resource_id" not in params:
            # Set default resourceId if not provided (for migration of old data)
            params["resourceId"] = "default"
        
        try:
            validated_params = SourceParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid Source params for node {node_def.id}: {e}")
        
        self.resource_id = validated_params.resource_id
        self.mode = validated_params.mode
        self.interval_ms = validated_params.interval_ms
        self.amount = validated_params.amount
        self.production_rate = validated_params.production_rate
        self.activation = validated_params.activation
        self.activation_mode = validated_params.activation_mode
        self.resource_color = validated_params.resource_color

    def to_node_def(self) -> NodeDef:
        """Convert instance back to NodeDef for serialization."""
        params = {"resourceId": self.resource_id}
        if self.mode is not None:
            params["mode"] = self.mode
        if self.interval_ms is not None:
            params["intervalMs"] = self.interval_ms
        if self.amount is not None:
            params["amount"] = self.amount
        if self.production_rate is not None:
            params["productionRate"] = self.production_rate
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

    def validate_incoming_connection(
        self,
        from_node_id: str,
        source_handle: Optional[str],
        target_handle: Optional[str],
        edge_id: Optional[str],
    ) -> list[ValidationIssue]:
        """Source nodes cannot have incoming edges."""
        issues: list[ValidationIssue] = []

        issues.append(
            ValidationIssue(
                code="INVALID_SOURCE_INPUT",
                message="Source nodes cannot have incoming edges. They only generate resources.",
                nodeId=self.id,
                edgeId=edge_id,
            )
        )

        return issues
