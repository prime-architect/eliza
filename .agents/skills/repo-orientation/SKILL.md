---
name: repo-orientation
description: Orientation and architectural triage before beginning work in any package or plugin in the elizaOS monorepo
---

# Repository Orientation Skill

Use this skill when beginning work on an unfamiliar area, package, or plugin within `prime-architect/eliza`.

## Workflow

1. **Working Tree & Git State**
   - Run `git status --short` and `git branch --show-current`.
   - Ensure the working tree is clean or that existing changes are accounted for.

2. **Context & Guide Ingestion**
   - Read the nearest package `README.md` and `AGENTS.md` (e.g., `packages/<pkg>/AGENTS.md` or `plugins/<plugin>/AGENTS.md`).
   - Consult root `AGENTS.md` for monorepo-wide invariant contracts.

3. **Interface & Boundary Discovery**
   - Identify the package's public export surface in `package.json` and barrel exports (`src/index.ts`).
   - Identify existing tests (`test/` or `__tests__/`) and reference patterns in maintained sibling packages.
   - Clarify whether the change touches core runtime contracts (`packages/core`) or host/plugin logic.

4. **Constraint Summary**
   - Synthesize architectural constraints, tenant isolation boundaries, and open questions before proposing or writing code.
