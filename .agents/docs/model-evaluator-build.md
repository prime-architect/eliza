# Model Evaluator & Provider/Model Dynamic — Build Document

**For:** Antigravity, working on the `prime-architect/eliza` checkout (branch `feat/strip-eliza-cloud`).
**Scope:** New plugin `plugin-model-evaluator` + `ModelsTab` dropdown behavior in `packages/ui`. Extends `models-providers-ux-build.md` (Tasks 3/6) — read that first.
**Conventions:** Bun + Turbo + Biome. `.test.tsx` + `.stories.tsx` for UI. Drizzle migrations are adds-only. All strings via `t()` with `defaultValue`. `bun run verify` before handoff. Do not commit/push without approval.

---

## 1. Objective

Two connected systems:

- **A. Ranker (background):** for each wired-in provider, score its models per category and keep a top-5 ranking fresh. Never reads current slot bindings — rankings are computed from catalogs + scores only.
- **B. Provider/model dynamic (UI):** in every Models-tab slot, the Provider control shows the provider's **user-defined name only**, and the Model dropdown lists **only that provider's models** for the slot, ordered by rank.

Rankings **suggest, never assign**. The user's no-defaults rule stands.

## 2. Categories (slots)

`small-chat, large-chat, medium-chat, reasoning-fast, reasoning-deep, embeddings, stt, tts, image-gen, vision, action-planner, response-handler, text-completion, pii-scrub, research` — mapped to `ModelType` in `packages/core/src/types/model.ts` (see models-providers-ux-build.md §6 table).

## 3. Architecture

```
Provider catalogs ──▶ adapters ──▶ Model records (registry)
                                          │
Benchmark seed + cost + local fitness ──▶ scoring engine ──▶ model_rankings table
                                          │                          │
Background jobs (per provider) ──────────┘                          │
                                                                     ▼
                                              Models tab: ranked, filtered dropdowns
```

## 4. Task 1 — Storage (Drizzle, adds-only migration)

New table `model_rankings`:
```ts
{
  providerId: string;      // FK → provider record
  category: string;        // slot key from §2
  modelId: string;         // FK → model record
  rank: number;            // 1..N within (provider, category)
  score: number;           // 0..1 composite
  reasons: string[];       // short human-readable score contributors
  benchmarkVersion: string;// seed version used
  scoredAt: string;        // ISO timestamp
}
// unique(providerId, category, rank)
```
Model records (registry) gain: `benchmarkScores: Record<string, number>`, `costPerUnit`, `latencyMs`, `releaseDate`, `deprecated`, `localEvalScore`.

## 5. Task 2 — Catalog adapters (`src/adapters/`)

One adapter per provider type; each implements `listModels(): Promise<RawModel[]>` normalized into Model records:
- `openai-compatible.ts` → `GET {baseUrl}/v1/models`
- `deepgram.ts` → Deepgram model endpoints (separate STT/TTS lists)
- `local-hf.ts` → HF tree API on `elizaos/eliza-1` (or custom repo ID) + `eliza-1.manifest.v1.json` for modality mapping
- `anthropic.ts`, `openai.ts`, `google.ts`, `ollama.ts` → respective list endpoints; `custom.ts` → user-pasted model list in the wizard

Adapters run at provider-add time and on refresh. Failures mark the provider `error` and keep last-known rankings (never blank the UI on a transient failure).

## 6. Task 3 — Scoring engine (`src/scoring/`)

Pure functions: `score(model, category) → { score, reasons }`. Weights are config (tunable without code). Defaults:

| Category | Quality | Latency | Cost | Context/capability | Freshness |
|---|---|---|---|---|---|
| small-chat | 0.25 | 0.35 | 0.30 | 0.00 | 0.10 |
| large-chat / medium-chat | 0.55 | 0.10 | 0.15 | 0.10 ctx | 0.10 |
| reasoning-fast | 0.50 | 0.25 | 0.10 | 0.05 | 0.10 |
| reasoning-deep | 0.65 | 0.05 | 0.10 | 0.10 ctx | 0.10 |
| embeddings | 0.60 (MTEB) | 0.10 | 0.15 | 0.05 dims | 0.10 |
| stt | 0.50 (WER) | 0.30 | 0.10 | 0.00 | 0.10 |
| tts | 0.45 (MOS) | 0.35 | 0.10 | 0.00 | 0.10 |
| image-gen / vision | 0.55 | 0.10 | 0.20 | 0.05 | 0.10 |
| action-planner / pii-scrub / research / completion / response-handler | 0.60 (task accuracy) | 0.15 | 0.15 | 0.00 | 0.10 |

- **Quality** = max(benchmark seed score, local fitness score) per relevant metric.
- **Benchmark seed** (`src/data/benchmarks.json`, versioned): curated scores per known model id; unknown models score quality from local fitness evals only, tagged "unevaluated".
- **Cost** normalized per category (cheaper = higher sub-score); **latency** from measured medians where available, provider-claimed otherwise (flagged).

## 7. Task 4 — Evaluator + background jobs

- **ElizaOS evaluator** `modelRankEvaluator`: runs scoring for one (provider, category) pair, writes ranks. Triggered by:
  1. **Provider add** (wizard test-connection success) → immediate full fetch + score. Blocking, must complete in seconds.
  2. **Daily catalog refresh** (per-provider job): detect new/deprecated models; score only what's new/changed.
  3. **Weekly**: benchmark-seed refresh check.
  4. **Monthly**: local fitness evals via the scenario runner (only for providers with local eval enabled; small prompt suites per §2 categories).
- **Event:** a refresh puts a new model in a category top-5 → write a quiet notice record (surfaced in the Providers tab as "New: X is now #2 for Deep reasoning"). No auto-assignment, ever.
- **Per-provider isolation:** one job per provider; a failing provider never blocks others.

## 8. Task 5 — API routes (in the plugin)

- `GET /api/model-rankings/:providerId/:category` → ranked models `{ rank, modelId, display, score, reasons }`, top-5 first, remainder after.
- `POST /api/model-rankings/:providerId/refresh` → trigger immediate re-score (used by the wizard + a "Refresh" button per provider row).

## 9. Task 6 — UI: the enforced provider/model dynamic

In `ModelSlotRow.tsx` (and anywhere a slot binding is edited):

**R1 — Provider shows the user-defined name only.**
- The Provider control's displayed value, its dropdown options, and the slot summary line all render `providerRecord.name` verbatim (e.g. `Nararouter`, `My Local Box`).
- Never render `"{type} · {name}"` or the generic type label as the name. A small type glyph may sit beside it; the text is the name, full stop.
- If two providers share a name, append a disambiguator the user confirms at add time (wizard validates uniqueness, suggests `"{name} 2"`).

**R2 — Model list is scoped to the selected provider.**
- Model dropdown options = registry models where `model.providerId === selectedProviderId AND model.serves includes slot`, ordered by `model_rankings.rank` for (provider, slot).
- Top 5 render with rank badge (`#1`–`#5`) + one-line reason; the rest under a "Show all N more" expander. Models with no ranking yet get an "unevaluated" tag, sorted last — never hidden.
- Changing the provider **resets the model selection to null**. A model from provider A can never remain selected under provider B (config-time invariant, enforced in `useModelSlots`, not just visually).
- Empty provider → model dropdown disabled with "Select a provider first".

**R3 — Rankings suggest, never assign.** A "Top pick" hint chip may appear on empty slots; clicking it fills the slot (still via Apply-all). Nothing auto-fills.

## 10. Task 7 — Wire into Models tab

- `ModelSlotsTab.tsx`: each `ModelSlotRow` fetches `GET /api/model-rankings/:providerId/:slot` on provider select (cache per session; refresh button per provider row in the Providers tab).
- Summary line format: `{Slot}: {providerName} · {modelDisplay}` or `{Slot}: Not assigned`.
- Apply-all diff shows names the same way.

## 11. Acceptance criteria

- [ ] Add provider → rankings computed immediately; slot dropdowns show ranked, provider-scoped models.
- [ ] Provider control renders the custom name everywhere; no generic-type prefix text.
- [ ] Switching provider clears the model; model list never contains another provider's models.
- [ ] Daily refresh picks up a new provider model and re-ranks without touching bindings.
- [ ] A provider API failure keeps last-known rankings and marks the provider `error`; UI never blanks.
- [ ] New top-5 entrant produces a quiet notice; no binding changes without the user.
- [ ] `.test.tsx` covers: name-only rendering, provider-scoped filtering, provider-switch reset, rank ordering.
- [ ] `bun run verify` green for touched workspaces.

## 12. Non-goals

- No automatic model assignment, ever.
- No changes to the escalation ladder or `ModelType` — ranking is advisory.
- No benchmark-scraping infrastructure; the seed file is curated and versioned.
- Per-agent override UI stays a later task.
- Do not commit/push without approval.
