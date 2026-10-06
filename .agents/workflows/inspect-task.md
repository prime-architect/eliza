---
description: Run repository orientation and boundary discovery without modifying any code
---

# /inspect-task Workflow

1. Execute `repo-orientation` skill.
2. Inspect `git status --short` and verify working-tree cleanliness.
3. Locate the owning package or plugin under `packages/` or `plugins/`.
4. Read nearest `AGENTS.md` and `README.md`.
5. Return a structured, no-edit technical assessment.
