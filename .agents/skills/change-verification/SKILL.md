---
name: change-verification
description: Rigorous tiered verification of code changes, tests, type checking, linting, and gate contracts
---

# Change Verification Skill

Use this skill after modifying code or when diagnosing build and CI failures in elizaOS.

## Execution Order

1. **Owning Package Verification (Tier 1)**
   - Run the scoped test, typecheck, and lint commands for the modified package:
     ```bash
     bun run --cwd <package-or-plugin> test
     bun run --cwd <package-or-plugin> typecheck
     bun run --cwd <package-or-plugin> lint:check
     ```

2. **Repository Verification Gates (Tier 2)**
   - When hardware resources permit (minimum 16 GB RAM recommended), execute repository-wide gates:
     ```bash
     bun run verify
     ```
   - For memory-constrained environments, run with concurrency limits:
     ```bash
     RUN_TURBO_CONCURRENCY=1 bun run verify
     ```

3. **Strict Gate Integrity**
   - Treat timeouts, out-of-memory terminations, missing toolchains, or skipped test suites as incomplete or failed runs—never as passing evidence.

4. **UI Visual Audit**
   - For changes touching `@elizaos/ui` or `@elizaos/app`, inspect desktop and mobile viewports.
   - Record visual evidence (screenshots, recordings) into `test-results/`.

5. **Reporting**
   - Provide exact commands executed, exit codes, failure logs, and explicitly identify any untested areas.
