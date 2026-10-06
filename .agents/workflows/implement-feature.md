---
description: Implement approved changes in small, verified, reviewable steps
---

# /implement-feature Workflow

1. Confirm that an approved plan exists (`/plan-feature`).
2. Verify clean base state before making modifications.
3. Apply changes in small, atomic, reviewable steps.
4. Run focused tests after each step (`bun run --cwd <pkg> test`).
5. Emit durable effect receipts for any external or stateful action.
6. Stop immediately if any unexpected external mutation or unapproved action is required.
