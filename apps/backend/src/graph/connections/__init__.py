"""Connection instance classes for different connection types."""

from ..connection_instance import ConnectionInstance
from .resource_connection import ResourceConnection
from .state_connection import StateConnection
from .trigger_connection import TriggerConnection
from ...shared.dsl_schema import ConnectionDef

__all__ = [
    "ConnectionInstance",
    "ResourceConnection",
    "StateConnection",
    "TriggerConnection",
    "create_connection_instance",
]


def create_connection_instance(connection_def: ConnectionDef) -> ConnectionInstance:
    """
    Factory function to create appropriate connection instance based on connection type.

    Args:
        connection_def: ConnectionDef instance

    Returns:
        ConnectionInstance subclass appropriate for the connection type
    """
    connection_type = connection_def.type or "resource"

    if connection_type == "resource":
        return ResourceConnection(connection_def)
    elif connection_type == "state":
        return StateConnection(connection_def)
    elif connection_type == "trigger":
        return TriggerConnection(connection_def)
    else:
        # Unknown connection type - default to Resource
        return ResourceConnection(connection_def)
