"""DSL structure validation using Pydantic."""

from typing import Optional
from ..shared.dsl_schema import GraphDSL, ValidationIssue


def validate_dsl_structure(data: dict) -> tuple[bool, Optional[GraphDSL], list[ValidationIssue]]:
    """
    Validate DSL structure using Pydantic.

    Args:
        data: Raw DSL data (dict)

    Returns:
        Tuple of (is_valid, parsed_dsl, issues)
    """
    issues: list[ValidationIssue] = []

    try:
        dsl = GraphDSL(**data)
        return True, dsl, issues
    except Exception as e:
        issues.append(
            ValidationIssue(
                code="INVALID_DSL_STRUCTURE",
                message=f"DSL structure validation failed: {str(e)}",
            )
        )
        return False, None, issues

