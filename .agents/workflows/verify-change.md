---
description: Run tiered validation, tests, lints, and gate checks on modified code
---

# /verify-change Workflow

1. Execute `change-verification` skill.
2. Run owning package unit and integration tests.
3. Run package typecheck and Biome linting (`lint:check`).
4. If modifying UI components, capture desktop/mobile visual evidence into `test-results/`.
5. Run repository verification gate (`bun run verify`) when memory capacity allows.
6. Report exact test inventory, results, and untested components.
