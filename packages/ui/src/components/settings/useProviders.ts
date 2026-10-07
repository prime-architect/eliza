/**
 * Manages user-configured model providers for Settings → Models & Providers.
 *
 * Persists provider records via agent config/settings. API credentials are
 * never stored in plaintext — only vault keys/handles are kept in ProviderRecord.
 * Provides helper to remove a provider and unassign associated model slots.
 */

import type { InstalledModel } from "@elizaos/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { client } from "../../api/client";

export type ProviderType =
  | "local"
  | "openai-compatible"
  | "anthropic"
  | "openai"
  | "google"
  | "deepgram"
  | "ollama"
  | "custom";

export type ProviderStatus = "untested" | "connected" | "error";

export interface ProviderRecord {
  id: string; // uuid or unique slug
  name: string; // user label
  type: ProviderType;
  baseUrl?: string;
  credentialVaultKey?: string; // vault handle only — never the secret
  serves: string[]; // ModelType values this provider can serve
  enabled: boolean;
  status: ProviderStatus;
  lastTestedAt?: string;
  customModels?: string[]; // optional list of custom model names provided
}

export interface LocalEngineInfo {
  available: boolean;
  downloadedCount: number;
  installedModels: InstalledModel[];
}

const STORAGE_KEY = "eliza_configured_providers_v1";

/** Sensible default capability sets per provider type. */
export const DEFAULT_SERVES_BY_TYPE: Record<ProviderType, string[]> = {
  local: [
    "TEXT_SMALL",
    "TEXT_LARGE",
    "TEXT_EMBEDDING",
    "TRANSCRIPTION",
    "TEXT_TO_SPEECH",
    "IMAGE_DESCRIPTION",
  ],
  "openai-compatible": [
    "TEXT_SMALL",
    "TEXT_LARGE",
    "TEXT_MEDIUM",
    "TEXT_REASONING_SMALL",
    "TEXT_REASONING_LARGE",
    "TEXT_EMBEDDING",
  ],
  anthropic: [
    "TEXT_SMALL",
    "TEXT_LARGE",
    "TEXT_MEDIUM",
    "TEXT_REASONING_SMALL",
    "TEXT_REASONING_LARGE",
  ],
  openai: [
    "TEXT_SMALL",
    "TEXT_LARGE",
    "TEXT_MEDIUM",
    "TEXT_REASONING_SMALL",
    "TEXT_REASONING_LARGE",
    "TEXT_EMBEDDING",
    "TRANSCRIPTION",
    "TEXT_TO_SPEECH",
    "IMAGE",
    "IMAGE_DESCRIPTION",
  ],
  google: [
    "TEXT_SMALL",
    "TEXT_LARGE",
    "TEXT_MEDIUM",
    "TEXT_REASONING_SMALL",
    "TEXT_REASONING_LARGE",
    "IMAGE_DESCRIPTION",
  ],
  deepgram: ["TRANSCRIPTION", "TEXT_TO_SPEECH"],
  ollama: ["TEXT_SMALL", "TEXT_LARGE", "TEXT_MEDIUM", "TEXT_EMBEDDING"],
  custom: ["TEXT_SMALL", "TEXT_LARGE"],
};

export const LOCAL_PROVIDER_RECORD: ProviderRecord = {
  id: "local",
  name: "Local inference",
  type: "local",
  serves: [
    "TEXT_SMALL",
    "TEXT_LARGE",
    "TEXT_MEDIUM",
    "TEXT_REASONING_SMALL",
    "TEXT_REASONING_LARGE",
    "TEXT_EMBEDDING",
    "TRANSCRIPTION",
    "TEXT_TO_SPEECH",
    "IMAGE",
    "IMAGE_DESCRIPTION",
    "ACTION_PLANNER",
    "RESPONSE_HANDLER",
    "TEXT_COMPLETION",
    "PII_SCRUB",
    "RESEARCH",
  ],
  enabled: true,
  status: "connected",
};

/** Seed curated models list per provider type. */
export const SEED_MODELS_BY_TYPE: Record<
  ProviderType,
  Array<{ id: string; label: string; costHint?: string; serves: string[] }>
> = {
  local: [
    {
      id: "e2b",
      label: "Eliza-1 2B (e2b) · Multimodal Pack",
      costHint: "On-device",
      serves: [
        "TEXT_SMALL",
        "TEXT_MEDIUM",
        "TEXT_EMBEDDING",
        "TRANSCRIPTION",
        "TEXT_TO_SPEECH",
        "IMAGE_DESCRIPTION",
      ],
    },
    {
      id: "e4b",
      label: "Eliza-1 4B (e4b) · General Chat & Embeddings",
      costHint: "On-device",
      serves: ["TEXT_LARGE", "TEXT_MEDIUM", "TEXT_EMBEDDING"],
    },
    {
      id: "12b",
      label: "Eliza-1 12B (12b) · Large Context Chat",
      costHint: "On-device",
      serves: ["TEXT_LARGE", "TEXT_MEDIUM"],
    },
    {
      id: "31b",
      label: "Eliza-1 31B (31b) · Deep Reasoning",
      costHint: "On-device",
      serves: ["TEXT_LARGE", "TEXT_REASONING_LARGE", "TEXT_REASONING_SMALL"],
    },
    {
      id: "31b-256k",
      label: "Eliza-1 31B 256k (31b-256k) · Ultra-long Context",
      costHint: "On-device",
      serves: ["TEXT_LARGE", "TEXT_REASONING_LARGE"],
    },
    {
      id: "bge-small-en-v1.5",
      label: "BGE Small En v1.5",
      costHint: "On-device",
      serves: ["TEXT_EMBEDDING"],
    },
    {
      id: "whisper-tiny",
      label: "Whisper Tiny",
      costHint: "On-device",
      serves: ["TRANSCRIPTION"],
    },
    {
      id: "kokoro-v0_19",
      label: "Kokoro TTS",
      costHint: "On-device",
      serves: ["TEXT_TO_SPEECH"],
    },
  ],
  "openai-compatible": [
    {
      id: "default-model",
      label: "Custom / Endpoint Model",
      costHint: "Endpoint pricing",
      serves: [
        "TEXT_SMALL",
        "TEXT_LARGE",
        "TEXT_MEDIUM",
        "TEXT_REASONING_SMALL",
        "TEXT_REASONING_LARGE",
        "TEXT_EMBEDDING",
      ],
    },
    {
      id: "mimo-v2.5",
      label: "Mimo v2.5",
      costHint: "NaraRouter",
      serves: ["TEXT_SMALL", "TEXT_MEDIUM"],
    },
    {
      id: "meta-llama/Llama-3.3-70B-Instruct",
      label: "Llama 3.3 70B Instruct",
      costHint: "Router / Endpoint",
      serves: ["TEXT_LARGE", "TEXT_REASONING_LARGE"],
    },
    {
      id: "deepseek/deepseek-chat",
      label: "DeepSeek V3",
      costHint: "Endpoint",
      serves: ["TEXT_LARGE", "TEXT_MEDIUM", "TEXT_SMALL"],
    },
    {
      id: "deepseek/deepseek-r1",
      label: "DeepSeek R1",
      costHint: "Endpoint / Reasoning",
      serves: ["TEXT_REASONING_LARGE", "TEXT_REASONING_SMALL"],
    },
    {
      id: "text-embedding-3-small",
      label: "Embedding 3 Small",
      costHint: "Endpoint",
      serves: ["TEXT_EMBEDDING"],
    },
    {
      id: "whisper-1",
      label: "Whisper 1",
      costHint: "Endpoint",
      serves: ["TRANSCRIPTION"],
    },
  ],
  anthropic: [
    {
      id: "claude-3-7-sonnet-latest",
      label: "Claude 3.7 Sonnet",
      costHint: "$3 / $15 per MTok",
      serves: [
        "TEXT_LARGE",
        "TEXT_MEDIUM",
        "TEXT_REASONING_LARGE",
        "IMAGE_DESCRIPTION",
      ],
    },
    {
      id: "claude-3-5-haiku-latest",
      label: "Claude 3.5 Haiku",
      costHint: "$0.80 / $4 per MTok",
      serves: ["TEXT_SMALL", "TEXT_REASONING_SMALL"],
    },
    {
      id: "claude-3-5-sonnet-latest",
      label: "Claude 3.5 Sonnet",
      costHint: "$3 / $15 per MTok",
      serves: [
        "TEXT_LARGE",
        "TEXT_MEDIUM",
        "TEXT_REASONING_LARGE",
        "IMAGE_DESCRIPTION",
      ],
    },
    {
      id: "claude-3-opus-latest",
      label: "Claude 3 Opus",
      costHint: "$15 / $75 per MTok",
      serves: ["TEXT_LARGE", "TEXT_REASONING_LARGE"],
    },
  ],
  openai: [
    {
      id: "gpt-4.1",
      label: "GPT-4.1",
      costHint: "$2 / $8 per MTok",
      serves: ["TEXT_LARGE", "TEXT_MEDIUM"],
    },
    {
      id: "gpt-4.1-mini",
      label: "GPT-4.1 Mini",
      costHint: "$0.15 / $0.60 per MTok",
      serves: ["TEXT_SMALL", "TEXT_REASONING_SMALL"],
    },
    {
      id: "gpt-4o",
      label: "GPT-4o",
      costHint: "$2.50 / $10 per MTok",
      serves: ["TEXT_LARGE", "TEXT_MEDIUM", "IMAGE_DESCRIPTION"],
    },
    {
      id: "gpt-4o-mini",
      label: "GPT-4o Mini",
      costHint: "$0.15 / $0.60 per MTok",
      serves: ["TEXT_SMALL", "TEXT_REASONING_SMALL", "IMAGE_DESCRIPTION"],
    },
    {
      id: "o3",
      label: "o3 Reasoning",
      costHint: "$10 / $40 per MTok",
      serves: ["TEXT_REASONING_LARGE"],
    },
    {
      id: "o4-mini",
      label: "o4-mini",
      costHint: "$1.10 / $4.40 per MTok",
      serves: ["TEXT_REASONING_SMALL"],
    },
    {
      id: "text-embedding-3-small",
      label: "Embedding 3 Small",
      costHint: "$0.02 per MTok",
      serves: ["TEXT_EMBEDDING"],
    },
    {
      id: "text-embedding-3-large",
      label: "Embedding 3 Large",
      costHint: "$0.13 per MTok",
      serves: ["TEXT_EMBEDDING"],
    },
    {
      id: "whisper-1",
      label: "Whisper 1",
      costHint: "$0.006 / min",
      serves: ["TRANSCRIPTION"],
    },
    {
      id: "tts-1",
      label: "TTS 1",
      costHint: "$15 per MTok",
      serves: ["TEXT_TO_SPEECH"],
    },
    {
      id: "tts-1-hd",
      label: "TTS 1 HD",
      costHint: "$30 per MTok",
      serves: ["TEXT_TO_SPEECH"],
    },
    {
      id: "dall-e-3",
      label: "DALL-E 3",
      costHint: "$0.040 / img",
      serves: ["IMAGE"],
    },
  ],
  google: [
    {
      id: "gemini-2.5-pro",
      label: "Gemini 2.5 Pro",
      costHint: "$1.25 / $5 per MTok",
      serves: ["TEXT_LARGE", "TEXT_REASONING_LARGE", "IMAGE_DESCRIPTION"],
    },
    {
      id: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      costHint: "$0.075 / $0.30 per MTok",
      serves: [
        "TEXT_SMALL",
        "TEXT_MEDIUM",
        "TEXT_REASONING_SMALL",
        "IMAGE_DESCRIPTION",
      ],
    },
    {
      id: "text-embedding-004",
      label: "Text Embedding 004",
      costHint: "$0.025 per MTok",
      serves: ["TEXT_EMBEDDING"],
    },
    {
      id: "imagen-3.0-generate-002",
      label: "Imagen 3",
      costHint: "$0.030 / img",
      serves: ["IMAGE"],
    },
  ],
  deepgram: [
    {
      id: "nova-3",
      label: "Nova-3 Speech Recognition",
      costHint: "$0.0043 / min",
      serves: ["TRANSCRIPTION"],
    },
    {
      id: "nova-2",
      label: "Nova-2 Speech Recognition",
      costHint: "$0.0043 / min",
      serves: ["TRANSCRIPTION"],
    },
    {
      id: "aura",
      label: "Aura Text-to-Speech",
      costHint: "$0.015 / 1k chars",
      serves: ["TEXT_TO_SPEECH"],
    },
    {
      id: "aura-asteria-en",
      label: "Aura Asteria (Female)",
      costHint: "$0.015 / 1k chars",
      serves: ["TEXT_TO_SPEECH"],
    },
  ],
  ollama: [
    {
      id: "llama3.2",
      label: "Llama 3.2",
      costHint: "Local host",
      serves: ["TEXT_SMALL", "TEXT_MEDIUM", "TEXT_REASONING_SMALL"],
    },
    {
      id: "llama3.3",
      label: "Llama 3.3",
      costHint: "Local host",
      serves: ["TEXT_LARGE", "TEXT_REASONING_LARGE"],
    },
    {
      id: "qwen2.5",
      label: "Qwen 2.5",
      costHint: "Local host",
      serves: ["TEXT_LARGE", "TEXT_MEDIUM"],
    },
    {
      id: "nomic-embed-text",
      label: "Nomic Embed Text",
      costHint: "Local host",
      serves: ["TEXT_EMBEDDING"],
    },
    {
      id: "whisper",
      label: "Whisper",
      costHint: "Local host",
      serves: ["TRANSCRIPTION"],
    },
  ],
  custom: [
    {
      id: "custom-model",
      label: "Custom Model",
      costHint: "Custom",
      serves: [
        "TEXT_SMALL",
        "TEXT_LARGE",
        "TEXT_MEDIUM",
        "TEXT_REASONING_SMALL",
        "TEXT_REASONING_LARGE",
      ],
    },
  ],
};

function readStoredProviders(): ProviderRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredProviders(records: ProviderRecord[]) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage quota or sandboxed failure
  }
}

export interface UseProvidersResult {
  providers: ProviderRecord[];
  allProviders: ProviderRecord[];
  localEngine: LocalEngineInfo;
  loading: boolean;
  addProvider: (
    provider: Omit<ProviderRecord, "id">,
  ) => Promise<ProviderRecord>;
  updateProvider: (id: string, patch: Partial<ProviderRecord>) => Promise<void>;
  toggleProvider: (id: string, enabled: boolean) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  refreshLocalEngine: () => Promise<void>;
}

export function useProviders(
  onProviderRemoved?: (providerId: string) => void,
): UseProvidersResult {
  const [providers, setProviders] = useState<ProviderRecord[]>(() =>
    readStoredProviders(),
  );
  const [loading, setLoading] = useState(false);
  const [localEngine, setLocalEngine] = useState<LocalEngineInfo>({
    available: true,
    downloadedCount: 0,
    installedModels: [],
  });

  const providersRef = useRef(providers);
  providersRef.current = providers;

  const persist = useCallback(async (next: ProviderRecord[]) => {
    setProviders(next);
    writeStoredProviders(next);
    try {
      if (typeof client.updateConfig === "function") {
        const envVars: Record<string, string> = {};
        for (const p of next) {
          if (p.enabled && p.baseUrl) {
            if (p.type === "ollama") envVars.OLLAMA_BASE_URL = p.baseUrl;
            if (p.type === "openai-compatible" || p.type === "custom") {
              envVars.OPENAI_BASE_URL = p.baseUrl;
            }
          }
        }
        const payload: Record<string, unknown> = {
          ui: {
            configuredProviders: next,
          },
        };
        if (Object.keys(envVars).length > 0) {
          payload.env = { vars: envVars };
        }
        await client.updateConfig(payload);
      }
    } catch {
      // Best-effort config sync; local state already updated
    }
  }, []);

  const refreshLocalEngine = useCallback(async () => {
    try {
      if (typeof client.getLocalInferenceInstalled === "function") {
        const resp = (await client.getLocalInferenceInstalled()) as {
          models?: InstalledModel[];
        };
        const models = Array.isArray(resp?.models) ? resp.models : [];
        setLocalEngine({
          available: true,
          downloadedCount: models.length,
          installedModels: models,
        });
      }
    } catch {
      setLocalEngine((prev) => ({ ...prev, available: false }));
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        if (typeof client.getConfig === "function") {
          const cfg = (await client.getConfig()) as Record<string, unknown>;
          const ui = cfg?.ui as Record<string, unknown> | undefined;
          const remoteProviders =
            (ui?.configuredProviders as ProviderRecord[] | undefined) ??
            (cfg?.providers as ProviderRecord[] | undefined);
          if (
            active &&
            Array.isArray(remoteProviders) &&
            remoteProviders.length > 0
          ) {
            setProviders(remoteProviders);
            writeStoredProviders(remoteProviders);
          }
        }
      } catch {
        // Fall back to stored providers
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    void refreshLocalEngine();
    return () => {
      active = false;
    };
  }, [refreshLocalEngine]);

  const addProvider = useCallback(
    async (input: Omit<ProviderRecord, "id">): Promise<ProviderRecord> => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `provider-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newRecord: ProviderRecord = { ...input, id };
      const next = [...providersRef.current, newRecord];
      await persist(next);
      return newRecord;
    },
    [persist],
  );

  const updateProvider = useCallback(
    async (id: string, patch: Partial<ProviderRecord>) => {
      const next = providersRef.current.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      );
      await persist(next);
    },
    [persist],
  );

  const toggleProvider = useCallback(
    async (id: string, enabled: boolean) => {
      await updateProvider(id, { enabled });
    },
    [updateProvider],
  );

  const removeProvider = useCallback(
    async (id: string) => {
      const next = providersRef.current.filter((p) => p.id !== id);
      await persist(next);
      if (onProviderRemoved) {
        onProviderRemoved(id);
      }
    },
    [persist, onProviderRemoved],
  );

  const allProviders = useMemo(() => {
    const hasLocal = providers.some(
      (p) => p.id === "local" || p.type === "local",
    );
    if (hasLocal) return providers;
    return [LOCAL_PROVIDER_RECORD, ...providers];
  }, [providers]);

  return {
    providers,
    allProviders,
    localEngine,
    loading,
    addProvider,
    updateProvider,
    toggleProvider,
    removeProvider,
    refreshLocalEngine,
  };
}
