# UPSTREAM.md — upstream sync log

Fork: `architect-prime/eliza-assistant` ("Assistant Edition")
Upstream: `elizaos/eliza`
Fork point: `65621da3` (develop HEAD, 2026-10-05, v2.0.4)
Previous pin: `27dec7b0` (2026-10-02, v2.0.3-beta.7) — research baseline; re-pinned 2026-10-05.

## Policy

- Rebase onto upstream `develop` weekly. `main` = upstream develop + merged feature branches; `feature/<area>` branches per workstream; `release/assistant-<n>` tags.
- Conflict-prone areas to watch: `packages/core` runtime pipeline, `packages/agent` API dispatch tables, Drizzle schemas.
- Upstream-first: generic fixes (bugs, perf, docs) get PR'd upstream; assistant-specific behavior stays in the fork. This keeps the rebase cheap.
- Versioning: `2.1.0-assistant.1` → semver pre-releases; core stays version-locked with upstream where untouched.

## Sync log

| Date | Upstream range | Result | Notes |
|---|---|---|---|
| 2026-10-05 | (fork point) `65621da3` | fork created | baseline verification below |

## Baseline verification (2026-10-05, 7.7 GB / 2 vCPU container)

- `bun install`: **green**. Requires `ELIZA_SKIP_FUSED_INFERENCE_SETUP=1` (the llama.cpp
  submodule clone stalls in this environment; fused inference is only needed for
  `plugin-local-inference` native builds) and a `bunx` shim (`~/.local/bin/bunx` →
  `bun x`, since this image ships `bun` without `bunx`).
- `bun run verify` turbo `typecheck`: **277/282 tasks green**. The 5 remaining tasks are
  the heaviest packages (`@elizaos/cloud-shared`, etc.) — their `tsc` workers are
  OOM-killed on this box (cloud-shared needs ~6 GB heap; plugin-knowledge passes
  solo). Environmental, not code errors: no type errors observed, only SIGKILL/SIGABRT
  from memory exhaustion.
- `lint:check`: **106/106 green**.
- All pre-turbo verify audits (biome version consistency, i18n, generated-system-files,
  migration prefix order, bun/turbo version contracts, workspace deps, plugin test
  conventions, alias guards, publish graph) pass.
- Operational notes for this host: `RUN_TURBO_CONCURRENCY=1` (2 works for install,
  1 for verify); run heavy package typechecks solo via
  `/usr/bin/node --max-old-space-size=4096 <repo>/node_modules/typescript/lib/tsc.js`.
  Full-workspace `bun run verify` needs a ≥16 GB host (matches upstream CI).
