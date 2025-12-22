<!-- docs/changes.md -->

# Change Log

This is an **append-only** log.
Add an entry whenever requirements change, scope is clarified, or implementation deviates from existing docs.

Template:

## YYYY-MM-DD
- Change:
- Reason:
- Impact:
- Migration/Notes:

---

## 2025-12-23
- Change: Initial project documents created (roadmap, architecture, ADR template).
- Reason: Establish source-of-truth documentation and sustainable development workflow.
- Impact: docs/*, .cursorrules, repo structure.
- Migration/Notes: N/A

## 2025-01-XX
- Change: Iteration 0 implemented with DSL v0.2 (instead of v0.1 as originally planned in roadmap).
- Reason: Example graph provided uses v0.2 schema; starting with v0.2 avoids immediate migration work.
- Impact: packages/dsl (schema version), docs/roadmap.md (updated to reflect v0.2).
- Migration/Notes: No migration needed as this is the initial version. Future versions will require migration functions.