---
name: feature-planning
description: Structured feature planning, architectural boundary delineation, and risk assessment before non-trivial implementations
---

# Feature Planning Skill

Use this skill before undertaking any non-trivial feature or modification in elizaOS.

## Requirements

Before writing implementation code, generate an explicit plan covering:

1. **Ownership & Placement**
   - Identify the exact package or plugin (`packages/*` or `plugins/*`) that owns the feature and provide the architectural rationale.
   - Keep core host-independent: ensure `@elizaos/core` contracts are untouched unless protocol-level additions are strictly needed.

2. **System Boundaries & Effects**
   - **APIs & DTOs:** Outline public contracts, ensuring validation is handled in `@elizaos/contracts` or boundary parsers.
   - **Authorization & Audit:** Document tenant boundaries, approval requirements, and effect receipts emitted.
   - **Model Registry:** Specify required model capabilities without hardcoding model slugs or IDs.
   - **Database & State:** Detail entity/relationship store usage or additions-only schema migrations.

3. **Verification Plan & Evidence**
   - List unit, integration, and scenario tests required.
   - For UI changes, identify required desktop/mobile visual inspection captures.

4. **Upstream Compatibility & Scope**
   - Assess upstream merge conflict risks.
   - Specify acceptance criteria and explicitly excluded scope.

Do not proceed with implementation until the user has approved the plan.
