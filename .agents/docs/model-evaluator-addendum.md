# Addendum — Model Evaluator: What Antigravity Must Update

**For:** Antigravity, on `prime-architect/eliza`, branch `feat/strip-eliza-cloud`.
**Context:** You already implemented `models-providers-ux-build.md` (ProvidersTab, ModelSlotsTab/Row, AddProviderWizard, ApplyAllBar, useProviders/useModelSlots, cloud strip — committed as `7920ff4b41`). This addendum plus `model-evaluator-build.md` (full background ranker spec — read it) define the delta. I read your implementation before writing this; all file/line references below are against your committed code.

## D1 — Provider display: custom name only (REQUIRED)

**Problem:** `ModelSlotRow.tsx` → `providerOptions` builds each option as `{ value: p.id, label: p.name, hint }` where `hint` is the provider *type* (`openai-compatible`), the baseUrl hostname, or "on-device". Rendered, the user sees the generic type/hostname next to (or instead of a clean read of) their chosen name.

**Change:**
- Remove the `hint` from provider options entirely. The option label is `p.name` and nothing else.
- Verify the select *trigger* (the closed control showing the current value) also renders name-only — if `SettingsSelectRow` appends hints to the trigger, pass a name-only display value.
- Apply the same rule everywhere a slot binding is displayed: the slot summary line and the Apply-all diff must read `{providerName} · {modelDisplay}` (e.g. `Small chat: Nararouter · mimo-v2.5`), never `{type} · {name}`.
- Type icons may remain as small glyphs; the *text* is the name, full stop.

## D2 — Name uniqueness in the wizard (REQUIRED — D1 depends on it)

- `AddProviderWizard.tsx`: validate the display name is unique across providers (case-insensitive). On collision, suggest `{name} 2` and block save until resolved.
- Name-only display is only unambiguous if names are unique. Enforce it at creation.

## D3 — Per-provider model catalog (REQUIRED — the core fix)

**Problem:** `ModelSlotRow.tsx` builds the model list from `SEED_MODELS_BY_TYPE[selectedProvider.type]` — static seeds keyed by provider *type*. Two `openai-compatible` providers show the identical model list. Models are not actually per-provider today.

**Change:**
1. Extend `ProviderRecord` (`useProviders.ts`) with:
   ```ts
   models: ProviderModel[]; // fetched catalog, the source of truth
   interface ProviderModel { id: string; label: string; serves: string[]; costHint?: string; }
   ```
2. Populate it in the wizard: after Test connection succeeds, fetch the provider's model catalog (adapter per type: `GET {baseUrl}/v1/models` for openai-compatible/ollama; Deepgram model endpoints for deepgram; HF tree API + bundle manifest for local; user-pasted list for custom) and store it on the record. Persist with the record (existing `eliza_configured_providers_v1` channel).
3. `ModelSlotRow.tsx` model options source order becomes:
   1. `selectedProvider.models` filtered by slot (`serves` includes slot, plus the existing advanced-slot inheritance) — **this is the list**;
   2. local installed models (as now);
   3. `customModels` (as now).
4. Demote `SEED_MODELS_BY_TYPE` to fallback-only: used solely when `provider.models` is empty (fetch failed), and those options get an `"catalog unavailable"` tag.
5. Remove the `p.type === selectedProviderId` fallback in the `selectedProvider` lookup — match by `id` only. Bindings already store ids (`handleProviderChange`), so the type-slug fallback is dead weight that can mis-resolve.
6. Remove the "keep stale model visible" splice for catalog models — a model not in the provider's catalog must not be selectable. Keep `customModels` handling as-is (user-entered, explicitly theirs).

## D4 — Rankings-ready UI (do now; plugin lands later)

The full ranker (`plugin-model-evaluator`: adapters, scoring engine, background jobs, `model_rankings` table, `GET /api/model-rankings/:providerId/:category`) is specified in `model-evaluator-build.md` and is the larger second half of this work. To avoid a UI rewrite when it lands:

- `ModelSlotRow` accepts an optional `rankings?: RankedModel[]` prop *now*. When absent/empty: current behavior (catalog order). When present: order by `rank`; top 5 get `#1`–`#5` badges + one-line reason; the remainder collapse under "Show all N more"; unranked models get an `unevaluated` tag and sort last — never hidden.
  ```ts
  interface RankedModel { modelId: string; rank: number; score: number; reasons: string[]; }
  ```
- Providers tab: add a per-provider "Refresh models" control that re-fetches the catalog (wires to `POST /api/model-rankings/:providerId/refresh` once the plugin exists; for now it re-runs the wizard's fetch).

## D5 — Already correct (do not change)

- `handleProviderChange` resets `modelId` to null on provider switch — keep; this is the required reset behavior.
- Provider dropdown filtered by `serves` capability — keep.
- "Not assigned" defaults everywhere — keep.
- No auto-assignment: rankings suggest only, via an optional "Top pick" hint chip on empty slots (fills the slot, still subject to Apply-all).

## Acceptance

- [ ] Two providers of the same type with different names show *different* model lists (their own fetched catalogs).
- [ ] Provider dropdown options, trigger, slot summaries, and Apply-all diff show the custom name only — no type/hostname hints.
- [ ] Wizard blocks duplicate provider names.
- [ ] Switching provider clears the model; a model from provider A can never persist under provider B.
- [ ] `ModelSlotRow` renders rank badges/expander/unevaluated tags correctly against a stubbed `rankings` prop.
- [ ] Seed lists appear only when a provider catalog fetch failed, tagged accordingly.
- [ ] `.test.tsx` covers: name-only rendering, per-provider catalog isolation, provider-switch reset, ranking-prop rendering.
- [ ] `bun run verify` green for `packages/ui`.

## Work order

1. D2 (wizard uniqueness) + D1 (name-only display) — small, independent.
2. D3 (per-provider catalog) — the substantial change; D4's prop shape first, then the fetch/store.
3. D4 rankings wiring stub (prop + badges against stub data).
4. Then `model-evaluator-build.md` Tasks 1–5 (plugin) as the follow-on work package.
