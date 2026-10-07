/**
 * Hook managing capability slot bindings for Settings → Models & Providers → Models.
 *
 * Tracks applied and draft slot bindings across chat, reasoning, embeddings,
 * speech, image, and advanced agent roles. Calculates dirty slots, diff summaries,
 * and handles atomic Apply-all persistence with restart confirmation.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { client } from "../../api/client";
import type { ProviderRecord } from "./useProviders";

export interface SlotBinding {
  slot: string;
  providerId: string | null;
  modelId: string | null;
}

export interface SlotDiffItem {
  slot: string;
  slotLabel: string;
  fromText: string;
  toText: string;
}

export interface SlotDefinition {
  slot: string;
  label: string;
  section:
    | "chat"
    | "reasoning"
    | "embeddings"
    | "speech"
    | "image"
    | "advanced";
  description: string;
  optional?: boolean;
}

export const MODEL_SLOTS: SlotDefinition[] = [
  // Chat
  {
    slot: "TEXT_SMALL",
    label: "Small chat",
    section: "chat",
    description: "Short completions, classifications, and fast responses.",
  },
  {
    slot: "TEXT_LARGE",
    label: "Large chat",
    section: "chat",
    description:
      "Main chat responses, complex instructions, and deep dialogue.",
  },
  {
    slot: "TEXT_MEDIUM",
    label: "Medium chat",
    section: "chat",
    description: "Mid-weight completions balancing speed and intelligence.",
    optional: true,
  },

  // Reasoning
  {
    slot: "TEXT_REASONING_SMALL",
    label: "Fast reasoning",
    section: "reasoning",
    description: "Rapid analytical thinking and sub-agent step planning.",
  },
  {
    slot: "TEXT_REASONING_LARGE",
    label: "Deep reasoning",
    section: "reasoning",
    description:
      "In-depth problem solving, mathematical logic, and multi-step tasks.",
  },

  // Embeddings
  {
    slot: "TEXT_EMBEDDING",
    label: "Embeddings",
    section: "embeddings",
    description: "Vector search, memory indexing, and semantic similarity.",
  },

  // Speech
  {
    slot: "TRANSCRIPTION",
    label: "Speech to text",
    section: "speech",
    description: "Audio transcription and voice message transcription.",
  },
  {
    slot: "TEXT_TO_SPEECH",
    label: "Text to speech",
    section: "speech",
    description: "Voice generation for agent replies.",
  },

  // Image
  {
    slot: "IMAGE",
    label: "Image generation",
    section: "image",
    description: "Synthesizing images from text prompts.",
  },
  {
    slot: "IMAGE_DESCRIPTION",
    label: "Vision / Description",
    section: "image",
    description:
      "Visual question answering and multimodal image understanding.",
  },

  // Advanced (collapsed)
  {
    slot: "ACTION_PLANNER",
    label: "Action planner",
    section: "advanced",
    description: "Agent action selection and tool execution planner.",
  },
  {
    slot: "RESPONSE_HANDLER",
    label: "Response handler",
    section: "advanced",
    description: "Post-processing and response formatting.",
  },
  {
    slot: "TEXT_COMPLETION",
    label: "Text completion",
    section: "advanced",
    description: "Raw text continuation without chat wrapper.",
  },
  {
    slot: "PII_SCRUB",
    label: "PII scrub",
    section: "advanced",
    description: "Privacy sanitization before external transmission.",
  },
  {
    slot: "RESEARCH",
    label: "Research",
    section: "advanced",
    description: "Extended search and knowledge aggregation.",
  },
];

const STORAGE_KEY = "eliza_configured_model_slots_v1";

function readStoredBindings(): Record<string, SlotBinding> {
  const initial: Record<string, SlotBinding> = {};
  for (const s of MODEL_SLOTS) {
    initial[s.slot] = { slot: s.slot, providerId: null, modelId: null };
  }
  if (typeof window === "undefined" || !window.localStorage) return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      for (const s of MODEL_SLOTS) {
        if (parsed[s.slot]) {
          initial[s.slot] = parsed[s.slot];
        }
      }
    }
    return initial;
  } catch {
    return initial;
  }
}

function writeStoredBindings(bindings: Record<string, SlotBinding>) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    // Storage quota or sandboxed failure
  }
}

export type SavePhase = "idle" | "saving" | "restarting" | "saved" | "error";

export interface UseModelSlotsResult {
  appliedBindings: Record<string, SlotBinding>;
  draftBindings: Record<string, SlotBinding>;
  dirtySlots: string[];
  diffs: SlotDiffItem[];
  savePhase: SavePhase;
  saveErrorMessage: string | null;
  setBinding: (
    slot: string,
    providerId: string | null,
    modelId: string | null,
  ) => void;
  discardAll: () => void;
  applyAll: (providers: ProviderRecord[]) => Promise<void>;
  unassignProvider: (providerId: string) => void;
}

export function useModelSlots(): UseModelSlotsResult {
  const [appliedBindings, setAppliedBindings] = useState<
    Record<string, SlotBinding>
  >(() => readStoredBindings());
  const [draftBindings, setDraftBindings] = useState<
    Record<string, SlotBinding>
  >(() => readStoredBindings());
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Sync from remote config if available
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (typeof client.getConfig === "function") {
          const cfg = (await client.getConfig()) as Record<string, unknown>;
          const ui = cfg?.ui as Record<string, unknown> | undefined;
          const remoteSlots =
            (ui?.modelSlots as Record<string, SlotBinding> | undefined) ??
            (cfg?.modelSlots as Record<string, SlotBinding> | undefined);
          if (active && remoteSlots && typeof remoteSlots === "object") {
            const merged = {
              ...readStoredBindings(),
              ...remoteSlots,
            };
            setAppliedBindings(merged);
            setDraftBindings(merged);
            writeStoredBindings(merged);
          }
        }
      } catch {
        // Fall back to local storage
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const dirtySlots = useMemo(() => {
    return MODEL_SLOTS.map((s) => s.slot).filter((slot) => {
      const a = appliedBindings[slot];
      const d = draftBindings[slot];
      return a?.providerId !== d?.providerId || a?.modelId !== d?.modelId;
    });
  }, [appliedBindings, draftBindings]);

  const setBinding = useCallback(
    (slot: string, providerId: string | null, modelId: string | null) => {
      setDraftBindings((prev) => ({
        ...prev,
        [slot]: { slot, providerId, modelId },
      }));
    },
    [],
  );

  const discardAll = useCallback(() => {
    setDraftBindings(appliedBindings);
    setSavePhase("idle");
    setSaveErrorMessage(null);
  }, [appliedBindings]);

  const unassignProvider = useCallback((providerId: string) => {
    const unassign = (prev: Record<string, SlotBinding>) => {
      const next: Record<string, SlotBinding> = { ...prev };
      for (const slot of Object.keys(next)) {
        if (next[slot]?.providerId === providerId) {
          next[slot] = { slot, providerId: null, modelId: null };
        }
      }
      return next;
    };

    setDraftBindings(unassign);
    setAppliedBindings((prev) => {
      const updated = unassign(prev);
      writeStoredBindings(updated);
      if (typeof client.updateConfig === "function") {
        client
          .updateConfig({
            ui: {
              modelSlots: updated,
            },
          })
          .catch(() => {
            // Best-effort config sync
          });
      }
      return updated;
    });
  }, []);

  const applyAll = useCallback(
    async (_providers: ProviderRecord[]) => {
      setSavePhase("saving");
      setSaveErrorMessage(null);
      try {
        // 1. Persist bindings to agent config and disk
        writeStoredBindings(draftBindings);
        setAppliedBindings(draftBindings);

        const envVars: Record<string, string> = {};
        const resolveType = (provId: string | null) => {
          if (!provId) return null;
          const p = _providers.find(
            (prov) => prov.id === provId || prov.type === provId,
          );
          return p?.type ?? provId;
        };

        const smallSlot = draftBindings.TEXT_SMALL;
        if (smallSlot?.modelId) {
          const smallType = resolveType(smallSlot.providerId);
          if (smallType === "local") {
            envVars.LOCAL_SMALL_MODEL = smallSlot.modelId;
          } else if (
            smallType === "openai" ||
            smallType === "openai-compatible" ||
            smallType === "cerebras"
          ) {
            envVars.OPENAI_SMALL_MODEL = smallSlot.modelId;
          } else if (smallType === "anthropic") {
            envVars.ANTHROPIC_SMALL_MODEL = smallSlot.modelId;
          } else if (smallType === "ollama") {
            envVars.OLLAMA_SMALL_MODEL = smallSlot.modelId;
          }
        }

        const largeSlot = draftBindings.TEXT_LARGE;
        if (largeSlot?.modelId) {
          const largeType = resolveType(largeSlot.providerId);
          if (largeType === "local") {
            envVars.LOCAL_LARGE_MODEL = largeSlot.modelId;
          } else if (
            largeType === "openai" ||
            largeType === "openai-compatible" ||
            largeType === "cerebras"
          ) {
            envVars.OPENAI_LARGE_MODEL = largeSlot.modelId;
          } else if (largeType === "anthropic") {
            envVars.ANTHROPIC_LARGE_MODEL = largeSlot.modelId;
          } else if (largeType === "ollama") {
            envVars.OLLAMA_LARGE_MODEL = largeSlot.modelId;
          }
        }

        const embeddingSlot = draftBindings.TEXT_EMBEDDING;
        if (embeddingSlot?.modelId) {
          const embType = resolveType(embeddingSlot.providerId);
          if (embType === "local") {
            envVars.LOCAL_EMBEDDING_MODEL = embeddingSlot.modelId;
          } else if (embType === "ollama") {
            envVars.OLLAMA_EMBEDDING_MODEL = embeddingSlot.modelId;
          }
        }

        if (typeof client.updateConfig === "function") {
          const payload: Record<string, unknown> = {
            ui: {
              modelSlots: draftBindings,
            },
          };
          if (Object.keys(envVars).length > 0) {
            payload.env = { vars: envVars };
          }
          await client.updateConfig(payload);
        }

        // 2. Restart agent server-side to apply model routing
        setSavePhase("restarting");
        if (typeof client.restart === "function") {
          try {
            await client.restart();
          } catch {
            // Ignore if restart signal resolves asynchronously
          }
        }

        setSavePhase("saved");
        setTimeout(() => {
          setSavePhase("idle");
        }, 3000);
      } catch (err) {
        setSavePhase("error");
        setSaveErrorMessage(err instanceof Error ? err.message : String(err));
      }
    },
    [draftBindings],
  );

  // Format diff summary items for the Apply-All bar
  const formatSlotDesc = useCallback((binding?: SlotBinding | null): string => {
    if (!binding?.providerId || !binding.modelId) {
      return "Not assigned";
    }
    return `${binding.providerId} · ${binding.modelId}`;
  }, []);

  const diffs = useMemo<SlotDiffItem[]>(() => {
    return dirtySlots.map((slot) => {
      const def = MODEL_SLOTS.find((s) => s.slot === slot);
      const applied = appliedBindings[slot];
      const draft = draftBindings[slot];
      return {
        slot,
        slotLabel: def?.label ?? slot,
        fromText: formatSlotDesc(applied),
        toText: formatSlotDesc(draft),
      };
    });
  }, [dirtySlots, appliedBindings, draftBindings, formatSlotDesc]);

  return {
    appliedBindings,
    draftBindings,
    dirtySlots,
    diffs,
    savePhase,
    saveErrorMessage,
    setBinding,
    discardAll,
    applyAll,
    unassignProvider,
  };
}
