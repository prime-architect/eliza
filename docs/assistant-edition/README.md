# Assistant Edition docs

The upstream docs are v1 and ~8 months stale — we don't patch them; we write our own.
This directory covers the assistant framework: imports, role packs, capability store,
conduct evals, money policy, privacy controls.

Planned pages (per fork plan §8):

- `imports.md` — the 23 blueprint imports + 5 AliceOS mechanisms (A1–A5)
- `role-packs.md` — the 21 roles grouped into shippable packs
- `capability-store.md` — manifests, permission grants, sandboxing, `eliza.lock`
- `conduct-evals.md` — the `test:conduct` lane, scenario suites, evidence artifacts
- `money-policy.md` — approvals, exact-totals cards, provider-hosted confirmation, idempotency
- `privacy.md` — forget/export, ephemeral mode, scope model, user-held-key E2E sync
- `model-registry.md` — providers own auth, models declare feature services, profile bindings
