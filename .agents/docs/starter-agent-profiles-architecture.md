# ElizaOS Reforged — Starter Agent Profiles Architecture

## 1. Core Architectural Principle
**Starter Builds, Not Concurrent Daemons.**

In ElizaOS Reforged:
- Agent profiles are **starter templates / builds** for users to select, configure, and develop.
- They serve as initial scaffolds containing personas, system instructions, default plugin capabilities, and model configurations.
- The runtime instantiates **exactly one** active agent profile at any time.
- The system **MUST NOT** spawn or maintain 22 concurrent live agent processes.

```
+----------------------------------------------------------------+
|                    Starter Profile Catalog                     |
|  (Static & Extensible Scaffolds: Eliza, Chen, Jin, Kei, etc.)  |
+----------------------------------------------------------------+
                               |
                               | User Selection / Onboarding
                               v
+----------------------------------------------------------------+
|                     Active Agent Instance                      |
|  - Materialized Configuration                                  |
|  - Single In-Process Runtime (Host: port 31337)                |
|  - Local Storage (PGlite / SQLite)                             |
|  - Local Embeddings (BGE-Small / Llama.cpp)                    |
+----------------------------------------------------------------+
```

## 2. Profile Definition Schema
Starter profiles conform to the `CharacterDefinition` and `StylePreset` contracts in `@elizaos/host`:

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique profile slug identifier |
| `name` | `string` | Display name of the starter build |
| `avatarIndex` | `number` | Built-in UI avatar visual mapping |
| `voicePresetId` | `string` | Voice engine synthesis preset |
| `bio` | `string[]` | Domain specialty and character context |
| `system` | `string` | System prompts and operational boundaries |
| `adjectives` | `string[]` | Behavioral style traits |
| `style` | `object` | Interaction style guidelines (all, chat, post) |
| `topics` | `string[]` | Knowledge domains and conversational focus |
| `plugins` | `string[]` | Recommended plugins for this starter specialization |

## 3. Catalog Integration Points
1. **Host Contract (`packages/host/src/character-presets.characters.ts`):** Authoritative static data table defining built-in starter presets.
2. **Preset Assembler (`packages/host/src/character-presets.ts`):** Materializes localized `StylePreset` instances on demand without loading excess hot-path data.
3. **App Catalog (`packages/app/src/character-catalog.ts`):** Exposes `APP_CHARACTER_CATALOG` to the frontend onboarding conductor (`use-first-run-conductor.ts`) for user selection.
4. **Lifecycle Route (`packages/agent/src/api/agent-lifecycle-routes.ts`):** Manages the state machine (`running`, `stopped`, `restarting`) for the single active runtime.

## 4. Development Workflow for New Starter Builds
To add or refine a starter build:
1. Add the profile specification to `CHARACTER_DEFINITIONS` in `character-presets.characters.ts`.
2. Provide default English and localized variant copy (`catchphrase`, `hint`, `postExamples`).
3. Ensure plugins associated with the profile are lazy-loaded only when the profile is selected and booted.
