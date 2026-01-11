"""Pydantic models for connection params validation."""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class ResourceConnectionParams(BaseModel):
    """Params for Resource Connection."""
    batch: Optional[float] = None
    weight: Optional[float] = None
    label: Optional[str] = None
    condition: Optional[str] = None
    interval: Optional[float] = None
    transfer: Optional[Literal["interval-based", "pull-any", "push-any"]] = None
    out_resource_id: Optional[str] = Field(None, alias="outResourceId")
    color_coding: Optional[bool] = Field(None, alias="colorCoding")
    color_coding_color: Optional[str] = Field(None, alias="colorCodingColor")
    shuffle_source: Optional[bool] = Field(None, alias="shuffleSource")
    limits_min: Optional[float] = Field(None, alias="limitsMin")
    limits_max: Optional[float] = Field(None, alias="limitsMax")
    
    model_config = {"populate_by_name": True}


class StateConnectionParams(BaseModel):
    """Params for State Connection."""
    condition: Optional[str] = None
    effect: Optional[str] = None
    target_property: Optional[str] = Field(None, alias="targetProperty")
    trigger_on: Optional[str] = Field(None, alias="triggerOn")
    color_coding: Optional[bool] = Field(None, alias="colorCoding")
    color_coding_color: Optional[str] = Field(None, alias="colorCodingColor")
    
    model_config = {"populate_by_name": True}


class TriggerConnectionParams(BaseModel):
    """Params for Trigger Connection."""
    trigger_condition: str = Field(alias="triggerCondition")
    effect: Optional[str] = None
    
    model_config = {"populate_by_name": True}
