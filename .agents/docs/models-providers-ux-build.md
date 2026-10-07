# Models & Providers UX/UI — Build Document

**For:** Antigravity, working on the `prime-architect/eliza` checkout (branch `feat/strip-eliza-cloud`).
**Scope:** `packages/ui/src/components/settings/` only. No core, agent, or plugin changes in this task.
**Design reference:** this document is self-contained. (Longer rationale lives in the designer's doc set; if you need it, ask the user.)
**Conventions:** Bun + Turbo + Biome. Every new component gets `.test.tsx` + `.stories.tsx` (repo convention). Reuse `SettingsGroup`, `SettingsRow`, `SettingsSelectRow`, `SettingsActionButton`, `Skeleton` from `./settings-agent-rows` / `./settings-layout` / `../ui/skeleton`. All user-facing strings go through `t()` with a `defaultValue` (i18n convention). Run `bun run verify` for touched workspaces before handing off.

---

## 1. Ground truth (verified — do not re-derive)

- **Eliza-1 sizes:** repo config names are `2b, 4b, 9b, 27b` (`ELIZA_MODEL` select in `packages/core/src/catalog/generated.json`). There is **no 7b**.
- **Published HF bundles** (`elizaos/eliza-1`, live) are named `e2b, e4b, 12b, 31b, 31b-256k` — the config names do NOT exist as bundles. Alias map (verified 2026-10-06): `2b→e2b, 4b→e4b, 9b→12b, 27b→31b`. Re-verify via the HF tree API at build time; never hardcode the list.
- **Function wiring:** `LOCAL_SMALL_MODEL` → `TEXT_SMALL`; `LOCAL_LARGE_MODEL` → `TEXT_LARGE`; `LOCAL_EMBEDDING_MODEL` → `TEXT_EMBEDDING`. Escalation ladder (`packages/core/src/runtime/action-model-routing.ts`): `LOCAL → TEXT_SMALL → TEXT_LARGE`.
- **Curated bundle contents** (from live HF listing):
  - `e2b` — full multimodal pack: text (32k/128k/256k), asr, tts (kokoro + omnivoice), vad (silero), vision, imagegen, mtp drafter. Fills: `TEXT_SMALL`, `TEXT_EMBEDDING`, `TRANSCRIPTION`, `TEXT_TO_SPEECH`, `IMAGE_DESCRIPTION`.
  - `e4b` — full pack + `embedding/eliza-1-embedding.gguf` (609 MB). Fills: `TEXT_LARGE`, `TEXT_EMBEDDING`.
  - `12b` — text 128k (7 GB). Fills: `TEXT_MEDIUM`, `TEXT_LARGE`.
  - `31b` — text 128k/256k (17.8 GB). Fills: `TEXT_LARGE`, `TEXT_MEGA`.
  - Each `e2b`/`e4b` bundle ships `eliza-1.manifest.v1.json` (schema `https://elizaos.ai/schemas/eliza-1.manifest.v1.json`) mapping modality → file with sha256. **Read the manifest to wire slots — never hand-map files to slots.**
- **Registry principle (framework rule):** providers own auth/transport; models declare `serves` (capabilities); this screen creates *bindings* (feature-service → model). No model ID is hardcoded in UI code outside seed data. API keys go to the vault; the UI only ever holds handles.

---

## 2. Target structure

```
Settings → Models & Providers
├── Tab: Providers
│   ├── Empty state → [Add provider]
│   ├── Provider list (incl. built-in "Local inference" card, zero models pre-selected)
│   └── [Add provider] → wizard (modal)
└── Tab: Models
    ├── Chat: Small / Large / Medium slots
    ├── Reasoning: Fast / Deep slots
    ├── Embeddings slot
    ├── Speech: Transcription / Text-to-speech slots
    ├── Image: Generation / Description slots
    ├── Advanced (collapsed): Action planner, Response handler, Completion, PII scrub, Research
    └── [Apply all] bar (diff preview + single restart confirm)
```

**Non-negotiable UX rules:**
1. Everything starts empty: no providers listed (except the Local engine card), no models listed, no slot selected.
2. Slot dropdowns are capability-filtered: provider list shows only added providers whose `serves` includes the slot; model list shows only that provider's models for the slot.
3. Removing a provider unassigns its models → slots revert to "Not assigned". Never a silent fallback.
4. One restart per editing session via "Apply all" — not per dropdown.
5. Test connection before a provider can be saved. Downloads verify sha256 from the bundle manifest.

---

## 3. Task 0 — Cloud strip (do first; it shrinks everything else)

**Delete:**
- `packages/ui/src/components/settings/useCloudModelConfig.ts`
- `packages/ui/src/components/settings/cloud-model-schema.ts`
- `packages/ui/src/components/settings/CloudAgentsSection.tsx` (+ `.test.tsx`)
- `packages/ui/src/components/settings/CloudOverviewSection.tsx` (+ `.test.tsx`)

**Edit:**
- `ProviderPanels.tsx` — remove `describeUnsignedCloudChat`, all unsigned-cloud copy branches, and the cloud sign-in panel body.
- `useProviderEntries.ts` — remove cloud merging from the provider list builder.
- `resolveServingAxes.ts` + `IntelligenceServingSummary.tsx` — remove cloud branches; keep the local-vs-external axes concept.
- `ProviderSwitcher.tsx` — remove the cloud tile/entry.
- `useProviderEntries.ts` — audit `SUBSCRIPTION_PROVIDER_SELECTIONS`: keep genuinely user-added subscriptions (e.g. coding subs = user credentials), remove cloud-backed entries.

**Audit (delete or gate; do not leave runtime branches):** in `packages/app/src`: `entry-cloud-api-key.ts`, `cloud-apps-view.ts`, `cloud-only-branding.ts`, `cloud-registration.ts`, first-run cloud onboarding smoke tests.

**Done when:** `git grep -ri "eliza cloud" -- packages/ui/src packages/app/src` returns only historical-changelog hits. Rule: the word "Cloud" in settings now means the user's own infrastructure.

---

## 4. Task 1 — Providers tab

**New file:** `packages/ui/src/components/settings/ProvidersTab.tsx`
- Empty state: icon + "No providers yet" + copy ("Add a provider to start assigning models.") + `[Add provider]` button.
- Provider list: rows reusing the `ProviderCard.tsx` visual language. Each row: name, type icon, status dot (`connected` / `error` / `untested`), `serves` chips, enable/disable toggle, remove (with confirm; triggers slot unassignment per rule 3).
- Built-in `Local inference` card: always present, status = engine availability, models = downloaded count, click-through to the local detail view (Task 5). Zero models pre-selected.

**Data — new hook** `useProviders.ts`:
```ts
interface ProviderRecord {
  id: string;                 // uuid
  name: string;               // user label
  type: "local" | "openai-compatible" | "anthropic" | "openai" | "google" | "deepgram" | "ollama" | "custom";
  baseUrl?: string;
  credentialVaultKey?: string; // vault handle only — never the secret
  serves: string[];            // ModelType values this provider can serve
  enabled: boolean;
  status: "untested" | "connected" | "error";
  lastTestedAt?: string;
}
```
Persist records via the existing agent settings channel (same one `useModelConfiguration` writes through); credentials only as vault handles.

---

## 5. Task 2 — Add provider wizard

**New file:** `packages/ui/src/components/settings/AddProviderWizard.tsx` (modal; agent-addressable controls like the rest of settings).
1. **Type picker** (segmented cards): Local inference · OpenAI-compatible endpoint · Anthropic · OpenAI · Google · Deepgram · Ollama · Custom.
2. **Fields** per type: display name (always); base URL (openai-compatible/ollama/custom); API key → direct to vault (never rendered back, never logged); `serves` multi-select chips pre-checked with sensible defaults per type, user-editable.
3. **[Test connection]** — required before Save enables. On failure show the error inline, keep the wizard open.
4. **Save** → record appears in the Providers tab with status `connected`.

---

## 6. Task 3 — Models tab (slots)

**New files:**
- `packages/ui/src/components/settings/ModelSlotsTab.tsx` — sections per §2 table; renders `ModelSlotRow` per slot.
- `packages/ui/src/components/settings/ModelSlotRow.tsx` — props: `{ slot: ModelType; label: string; description: string }`. Two `SettingsSelectRow` controls: Provider (filtered: added + enabled + `serves` includes slot), then Model (filtered: provider's models for slot, with cost hint). Both empty by default with "Not assigned"/"Choose…" placeholders.

**Slot table:**
| Section | Slot (label) | ModelType |
|---|---|---|
| Chat | Small | `TEXT_SMALL` |
| Chat | Large | `TEXT_LARGE` |
| Chat | Medium (optional) | `TEXT_MEDIUM` |
| Reasoning | Fast | `TEXT_REASONING_SMALL` |
| Reasoning | Deep | `TEXT_REASONING_LARGE` |
| Embeddings | Embeddings | `TEXT_EMBEDDING` |
| Speech | Transcription | `TRANSCRIPTION` |
| Speech | Text-to-speech | `TEXT_TO_SPEECH` |
| Image | Generation | `IMAGE` |
| Image | Description | `IMAGE_DESCRIPTION` |
| Advanced (collapsed) | Action planner / Response handler / Completion / PII scrub / Research | `ACTION_PLANNER`, `RESPONSE_HANDLER`, `TEXT_COMPLETION`, `PII_SCRUB`, `RESEARCH` — inherit Small/Large unless overridden |

**Refactor** `ModelConfigurationPanel.tsx`: the Small/Large/Coding groups become slot rows; **delete** the `providerLocked` ("follows active provider") concept — every slot picks its own provider now. Keep the restart-confirm UX pattern, but move it into the Apply-all bar.

**Data — new hook** `useModelSlots.ts`:
```ts
interface SlotBinding { slot: string; providerId: string | null; modelId: string | null; }
```
Bindings persist per the existing model-config channel. Changing a slot marks it dirty; nothing applies until the Apply-all bar confirms.

---

## 7. Task 4 — Apply-all bar

Sticky bottom bar in the Models tab, visible when ≥1 slot is dirty:
- Lists the diff: `Small chat: Not assigned → Nararouter · mimo-v2.5`, etc.
- `[Apply & restart]` → confirm inline ("Saving restarts the agent. Anything in progress is interrupted.") → single restart.
- `[Discard]` reverts to last applied state.
- Reuses the `SaveStatus`/`SaveErrorNotice` patterns already in `ModelConfigurationPanel.tsx` (extract them; don't duplicate).

---

## 8. Task 5 — Local provider detail (curated Eliza-1 list)

**Adapt** `../local-inference/LocalInferencePanel.tsx` (do not fork it) into the Local provider's detail view:
- **Curated list** (§1 table): each row shows params, context, download size, target hardware, slots it fills, and state: `[Download]` → progress bar with pause/resume → `✓ Downloaded` → `[Assign]` (fills its slots → marks Models-tab slots dirty → user confirms in Apply-all).
- **Build-time verification:** fetch `https://huggingface.co/api/models/elizaos/eliza-1/tree/main/bundles` at build/dev time to confirm names + sizes; surface a warning in the UI if the published set drifts from the curated list.
- **Manifest-driven wiring:** after download, read the bundle's `eliza-1.manifest.v1.json`; use its modality→file map (+ sha256 verification) to know which file serves which slot.
- **Fallbacks:** "Custom HuggingFace repo" (repo ID input → list `.gguf` files → pick) and "Local GGUF file" (file picker → copies/registers into `MODELS_DIR`).
- Show `MODELS_DIR` path and a disk-space check before any download starts. Quant note: the runtime auto-picks the quant flavor per detected GPU — surface this as info text, not a control.

---

## 9. Task 6 — Navigation wiring

- `ProviderSwitcher.tsx` becomes the tab container ("Providers" | "Models"); remove tile-based switching.
- `settings-navigation-model.ts` / `settings-section-registry.ts`: the "Models & Providers" entry points at the new tab container. Keep route IDs stable so deep links don't break.

---

## 10. Acceptance criteria (all tasks)

- [ ] Fresh state: Providers tab shows only the Local engine card (0 models); Models tab shows every slot "Not assigned".
- [ ] Add provider → test connection → save → provider appears; its models appear only in slots whose capability it serves.
- [ ] Slot assignment: provider then model; Apply-all shows the diff; one restart applies everything.
- [ ] Remove a provider → its slots revert to "Not assigned" with a visible notice; no silent rerouting.
- [ ] Local: curated list renders with live-verified names/sizes; download → sha256 verify → Assign fills the right slots per the bundle manifest.
- [ ] `git grep -ri "eliza cloud" -- packages/ui/src packages/app/src` → only changelog hits.
- [ ] No hardcoded model IDs in new UI code outside the (build-verified) curated-list seed.
- [ ] `.test.tsx` + `.stories.tsx` for every new component; `bun run verify` green for `packages/ui`.
- [ ] Every string via `t()` with `defaultValue`.

## 11. Explicit non-goals

- No `packages/core` / `packages/agent` changes. If a slot can't be bound with existing APIs, flag it — don't extend the API in this task.
- No per-agent overrides UI (character `models` block editor) — later task.
- No pricing/catalog backend — cost hints are display-only from provider metadata.
- Do not commit, push, or open PRs without explicit approval (repo rule).
