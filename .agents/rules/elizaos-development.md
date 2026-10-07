---
description: Core development principles, architecture contracts, and engineering constraints for elizaOS Assistant Edition
---

# elizaOS Development Rule

This rule governs engineering work in the `prime-architect/eliza` fork. Manifests and package sources are authoritative.

## 1. Scope & Isolation
- **Working Tree Integrity:** Preserve unrelated changes. Always inspect status and diffs before editing.
- **Context Discovery:** Read the repository root `AGENTS.md` and `README.md`, followed by the nearest package or plugin `AGENTS.md` and `README.md` before making any modification.
- **Core Architecture:** Keep `@elizaos/core` strictly independent of host applications. Core manages state, memory, cancellation, and contracts. Assistant Edition capabilities belong exclusively in plugins, services, providers, evaluators, or actions.
- **Upstream Discipline:** Generic fixes and bug repairs should be upstream-viable. Assistant Edition specific features must stay cleanly decoupled in first-party or modular plugins.
- **Branch & PR Policy:** Pull requests strictly target `develop`. Never push to branches, create remotes, or open PRs without explicit user authorization.

## 2. Robustness & Safety
- **Untrusted Input:** Validate all external and untrusted data at ingress boundaries.
- **Tenant & Authorization Isolation:** Strictly enforce authorization, tenant boundaries, and cancellation tokens.
- **Truth in Execution:** Never fabricate success receipts or convert errors into empty responses. Throw typed errors, record actionable runtime diagnostics via structured loggers, and invoke `runtime.reportError`.
- **Durable Effect Receipts:** Every mutation, payment action, browser automation step, or external effect must emit an auditable effect receipt.
- **Infrastructure Reuse:** Reuse existing schedulers, entity/relationship stores, content-addressed media stores, and built-in SSRF protections. Never introduce unmonitored shadow stores.

## 3. Configuration & Database
- **Model Registry:** Never hardcode concrete model IDs in product feature code. Request capabilities through the model registry abstraction.
- **Secret Hygiene:** Secrets, tokens, and credentials must never appear in source code, logs, prompts, test fixtures, URLs, or committed configuration files.
- **Database Migrations:** Schema migrations (e.g., Drizzle ORM in `plugin-sql`) are strictly **additions-only**. Destructive column drops or table truncations are prohibited.

## 4. Verification Standards
- **Layered Validation:** Verify the owning package first using its local test, typecheck, and lint scripts. Run repository-wide gates (`bun run verify`) only when resource capacity permits.
- **No False Passes:** Never treat timeouts, out-of-memory errors, or skipped suites as passing checks.
- **Visual Evidence:** UI modifications require desktop and mobile inspection and visual evidence records before submission.

## 5. Space Bunny Round-Robin Routing Policy
- **Multi-Host Cycling:** Space Bunny Free must never be pinned to a single host. Requests cycle round-robin across connected hosts advertising `space-bunny-free` (`opencode-go` with API key, `opencode` free tier).
- **Execution Strategy:** Round-robin with sticky limit 1 (next request moves to subsequent host).
- **Fail-Closed & Fallback:** If all round-robin members fail, fail closed to the verified free fallback model (`deepseek-v4-flash`). Never guess unverified free hosts.
- **Cost Guard:** Free hosts only; no paid member may enter the round-robin cycle without explicit user approval.
- **Verification Requirement:** Hosts may join the cycle only after connection and live model verification. Dead members are pruned immediately.

