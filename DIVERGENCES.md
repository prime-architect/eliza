# DIVERGENCES.md — where the fork differs from upstream

Authoritative list of intentional behavioral divergences from `elizaos/eliza`.
Update with every assistant-specific change. Generic fixes are PR'd upstream, not listed here.

| Area | Divergence | Rationale |
|---|---|---|
| `.gitignore` | Negation `!docs/assistant-edition/` — our docs live in-tree | Upstream ignores `docs/*` (docs site lives elsewhere); fork plan §8 requires in-tree assistant-framework docs |

## Conventions

- Core (`packages/core`) stays host-agnostic and diff-small; everything else is plugins, services, providers, or evaluators.
- Drizzle migrations are adds-only (no rollbacks), matching upstream's rule.
- Bun 1.4.2 + Turbo + Biome as upstream; every new package/plugin passes `bun run verify`.
