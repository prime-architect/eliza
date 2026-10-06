---
name: plugin-implementation
description: Authoring and modifying elizaOS plugins with lifecycle contracts, boundary validation, and auditable effect receipts
---

# Plugin Implementation Skill

Use this skill when developing, refactoring, or extending an elizaOS plugin under `plugins/`.

## Implementation Standards

1. **Architecture & Registration**
   - Model the plugin after a maintained first-party plugin (e.g., `plugin-sql`, `plugin-browser`, `plugin-personal-assistant`).
   - Export a typed `Plugin` object with explicit actions, providers, evaluators, services, routes, and events.
   - Enforce service lifecycles with clean startup, cancellation listeners, and teardown handlers (`quiesce` / `settle`).

2. **Boundary Validation & Security**
   - Validate configuration parameters at startup and reject invalid or missing credentials early.
   - Validate all untrusted input at ingress points using schema validators.
   - Do not bypass SSRF guards, and use content-addressed media stores for attachments.

3. **Execution Integrity & Receipts**
   - Respect cancellation tokens throughout asynchronous operations.
   - Never fabricate successes or swallow errors into empty data payloads; throw typed domain errors.
   - Place irreversible effects (state mutations, payments, device controls) behind approval gates.
   - Emit persistent, auditable effect receipts for all completed actions.

4. **Testing & Documentation**
   - Add focused unit and integration tests under the plugin's `test/` directory.
   - Document new actions, providers, settings, and requirements in the plugin's `README.md` and `AGENTS.md`.
