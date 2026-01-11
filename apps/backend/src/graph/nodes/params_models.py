"""Pydantic models for node params validation."""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class PoolParams(BaseModel):
    resource_id: str = Field(alias="resourceId")
    initial: Optional[float] = None
    capacity: Optional[float] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["push-all", "pull-any", "push-any"]] = Field(None, alias="activationMode")
    overflow: Optional[Literal["block", "allow"]] = None
    show_in_chart: Optional[bool] = Field(None, alias="showInChart")
    resource_color: Optional[str] = Field(None, alias="resourceColor")
    
    model_config = {"populate_by_name": True}


class SourceParams(BaseModel):
    resource_id: str = Field(alias="resourceId")
    mode: Optional[Literal["interval", "instant"]] = None
    interval_ms: Optional[float] = Field(None, alias="intervalMs")
    amount: Optional[float] = None
    production_rate: Optional[float] = Field(None, alias="productionRate")
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["push-any", "push-all"]] = Field(None, alias="activationMode")
    resource_color: Optional[str] = Field(None, alias="resourceColor")
    
    model_config = {"populate_by_name": True}


class DrainParams(BaseModel):
    resource_id: Optional[str] = Field(None, alias="resourceId")
    consumption_rate: Optional[float] = Field(None, alias="consumptionRate")
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["pull-any"]] = Field(None, alias="activationMode")
    
    model_config = {"populate_by_name": True}


class ConverterParams(BaseModel):
    input_resource_id: str = Field(alias="inputResourceId")
    output_resource_id: str = Field(alias="outputResourceId")
    conversion_rate: float = Field(alias="conversionRate")
    conversion: Optional[Literal["single", "batch"]] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["pull-any"]] = Field(None, alias="activationMode")
    resource_color: Optional[str] = Field(None, alias="resourceColor")
    
    model_config = {"populate_by_name": True}


class TraderParams(BaseModel):
    offer_resource_id: str = Field(alias="offerResourceId")
    offer_amount: float = Field(alias="offerAmount")
    request_resource_id: str = Field(alias="requestResourceId")
    request_amount: float = Field(alias="requestAmount")
    trade: Optional[Literal["single", "batch"]] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    
    model_config = {"populate_by_name": True}


class GateParams(BaseModel):
    distribution: Literal["dice", "deterministic"]
    distribution_mode: Optional[Literal["probabilistic", "deterministic"]] = Field(None, alias="distributionMode")
    weights: Optional[list[float]] = None
    condition: Optional[str] = None
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["pull-any", "push-all"]] = Field(None, alias="activationMode")
    
    model_config = {"populate_by_name": True}


class RandomSplitParams(BaseModel):
    weights: list[float]
    consume_input: Optional[bool] = Field(None, alias="consumeInput")
    activation: Optional[Literal["automatic", "passive", "interactive"]] = None
    activation_mode: Optional[Literal["pull-any", "push-all"]] = Field(None, alias="activationMode")
    
    model_config = {"populate_by_name": True}


class RegisterParams(BaseModel):
    formula: Optional[str] = None
    interactive: Optional[bool] = None
    initial: Optional[float] = None
    step: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    show_in_chart: Optional[bool] = Field(None, alias="showInChart")
    force_update_each_step: Optional[bool] = Field(None, alias="forceUpdateEachStep")
    
    model_config = {"populate_by_name": True}
