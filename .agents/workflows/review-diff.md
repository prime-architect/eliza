---
description: Perform comprehensive security, boundary, and test completeness review on the working diff
---

# /review-diff Workflow

1. Execute `security-review` skill across the complete working-tree diff.
2. Verify authorization checks, tenant boundaries, SSRF guards, and secret exclusion.
3. Check for presence of negative tests and edge-case handling.
4. Verify that schema migrations are adds-only and effect receipts are recorded.
5. Provide a classified review separating Blockers from Recommendations.
