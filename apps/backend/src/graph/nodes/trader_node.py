"""Trader node instance - exchanges resources."""

from typing import Optional, Literal
from ...shared.dsl_schema import NodeDef, ValidationIssue
from .base_node import NodeInstance
from .params_models import TraderParams


class TraderNode(NodeInstance):
    """Trader node: can have both incoming and outgoing edges."""

    # Typed attributes
    offer_resource_id: str
    offer_amount: float
    request_resource_id: str
    request_amount: float
    trade: Optional[Literal["single", "batch"]] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None

    def __init__(self, node_def: NodeDef):
        """Initialize Trader node from NodeDef."""
        super().__init__(node_def)
        
        params = node_def.params or {}
        # Handle missing required fields for backward compatibility with old data
        if "offerResourceId" not in params and "offer_resource_id" not in params:
            params["offerResourceId"] = "default"
        if "offerAmount" not in params and "offer_amount" not in params:
            params["offerAmount"] = 1.0
        if "requestResourceId" not in params and "request_resource_id" not in params:
            params["requestResourceId"] = "default"
        if "requestAmount" not in params and "request_amount" not in params:
            params["requestAmount"] = 1.0
        
        try:
            validated_params = TraderParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid Trader params for node {node_def.id}: {e}")
        
        self.offer_resource_id = validated_params.offer_resource_id
        self.offer_amount = validated_params.offer_amount
        self.request_resource_id = validated_params.request_resource_id
        self.request_amount = validated_params.request_amount
        self.trade = validated_params.trade
        self.activation = validated_params.activation

    def to_node_def(self) -> NodeDef:
        """Convert instance back to NodeDef for serialization."""
        params = {
            "offerResourceId": self.offer_resource_id,
            "offerAmount": self.offer_amount,
            "requestResourceId": self.request_resource_id,
            "requestAmount": self.request_amount,
        }
        if self.trade is not None:
            params["trade"] = self.trade
        if self.activation is not None:
            params["activation"] = self.activation
        
        return NodeDef(
            id=self.id,
            type=self.type,
            params=params,
            visual=self.visual,
        )

    # No additional validation needed - traders accept all connections
    pass
