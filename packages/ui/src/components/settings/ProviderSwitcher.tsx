/**
 * Models & Providers Settings Container (Settings → Models & Providers).
 *
 * Implements Task 6:
 * Tab container ("Providers" | "Models") replacing the legacy tile switcher.
 * - Providers tab: Lists built-in local inference engine and user-added providers,
 *   with click-through to LocalProviderDetail.
 * - Models tab: Slot assignment matrix (Chat, Reasoning, Embeddings, Speech, Image, Advanced)
 *   with sticky Apply-all restart bar.
 */

import { Cpu, Layers } from "lucide-react";
import { useCallback, useState } from "react";
import { useAppSelector } from "../../state/app-store";
import {
  SegmentedControl,
  type SegmentedControlItem,
} from "../ui/segmented-control";
import { LocalProviderDetail } from "./LocalProviderDetail";
import { ModelSlotsTab } from "./ModelSlotsTab";
import { ProvidersTab } from "./ProvidersTab";
import type { ServingAxes } from "./resolveServingAxes";
import { SettingsRow } from "./settings-layout";
import { useModelSlots } from "./useModelSlots";
import type { ProviderListEntry } from "./useProviderEntries";
import { useProviders } from "./useProviders";

export type ModelsAndProvidersTab = "providers" | "models";

export interface ProviderSwitcherProps {
  initialTab?: ModelsAndProvidersTab;
  onNavigateTab?: (tab: ModelsAndProvidersTab) => void;
}

export function ProviderSwitcher({
  initialTab = "providers",
  onNavigateTab,
}: ProviderSwitcherProps = {}) {
  const t = useAppSelector((s) => s.t);
  const [activeTab, setActiveTab] = useState<ModelsAndProvidersTab>(initialTab);
  const [viewingLocalDetail, setViewingLocalDetail] = useState(false);

  const { allProviders } = useProviders();
  const modelSlots = useModelSlots();
  const { unassignProvider, setBinding } = modelSlots;

  const handleTabChange = useCallback(
    (tab: ModelsAndProvidersTab) => {
      setActiveTab(tab);
      setViewingLocalDetail(false);
      if (onNavigateTab) {
        onNavigateTab(tab);
      }
    },
    [onNavigateTab],
  );

  const handleProviderRemoved = useCallback(
    (providerId: string) => {
      unassignProvider(providerId);
    },
    [unassignProvider],
  );

  const handleAssignLocalBundle = useCallback(
    (bundle: { fillsSlots: string[]; id: string }) => {
      // Wires local provider to the bundle's filled slots
      for (const slot of bundle.fillsSlots) {
        setBinding(slot, "local", bundle.id);
      }
      setActiveTab("models");
      setViewingLocalDetail(false);
    },
    [setBinding],
  );

  const tabItems: SegmentedControlItem<ModelsAndProvidersTab>[] = [
    {
      value: "providers",
      label: (
        <span className="flex items-center gap-1.5">
          <Cpu className="size-3.5" aria-hidden />
          {t("providerswitcher.tabProviders", { defaultValue: "Providers" })}
        </span>
      ),
      agentId: "tab-providers",
      agentLabel: "Providers tab",
    },
    {
      value: "models",
      label: (
        <span className="flex items-center gap-1.5">
          <Layers className="size-3.5" aria-hidden />
          {t("providerswitcher.tabModels", { defaultValue: "Models" })}
        </span>
      ),
      agentId: "tab-models",
      agentLabel: "Models tab",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-txt-strong">
            {t("providerswitcher.sectionHeading", {
              defaultValue: "Models & Providers",
            })}
          </h1>
          <p className="text-xs text-muted">
            {t("providerswitcher.sectionDescription", {
              defaultValue:
                "Configure external AI providers, local inference, and fine-grained capability slot assignments.",
            })}
          </p>
        </div>

        <SegmentedControl
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
          aria-label={t("providerswitcher.tabSelectorAria", {
            defaultValue: "Models and providers tabs",
          })}
        />
      </div>

      {/* Tab Content */}
      {activeTab === "providers" ? (
        viewingLocalDetail ? (
          <LocalProviderDetail
            onBack={() => setViewingLocalDetail(false)}
            onAssignSlots={handleAssignLocalBundle}
          />
        ) : (
          <ProvidersTab
            onNavigateToLocalDetail={() => setViewingLocalDetail(true)}
            onProviderRemoved={handleProviderRemoved}
          />
        )
      ) : (
        <ModelSlotsTab providers={allProviders} modelSlotsHook={modelSlots} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Backward-compatibility exports for legacy tests and focused helpers
// ---------------------------------------------------------------------------

export function reconcileProviderEntriesWithServingAxes(
  entries: ProviderListEntry[],
  axes: ServingAxes,
): ProviderListEntry[] {
  if (axes.inference !== "external" && axes.inference !== "unknown") {
    return entries;
  }
  const providerId = axes.activeChatProvider?.trim().toLowerCase() ?? "";
  return entries.map((entry) => {
    if (entry.category === "subscription") {
      return entry;
    }
    const current =
      axes.inference === "external" &&
      entry.category === "key" &&
      entry.id.trim().toLowerCase() === providerId;
    return {
      ...entry,
      current,
    };
  });
}

export function resolveActiveChatCatalogProvider(
  resolvedSelectedId: string | null,
  elizaCloudConnected: boolean,
): "elizacloud" | "cerebras" | "claude-chat" | undefined {
  if (resolvedSelectedId === "__cloud__") {
    return elizaCloudConnected ? "elizacloud" : undefined;
  }
  if (resolvedSelectedId === "cerebras") return "cerebras";
  if (resolvedSelectedId === "anthropic") return "claude-chat";
  return undefined;
}

export function ActiveProviderSummary({
  entry,
  t,
}: {
  entry: ProviderListEntry;
  t: (key: string, vars?: Record<string, unknown>) => string;
}) {
  const Icon = entry.icon;
  const codingAgentsOnly = entry.category === "subscription";
  return (
    <SettingsRow
      label={
        <span className="flex items-center gap-2">
          <Icon className="size-[18px] shrink-0 text-accent" aria-hidden />
          {entry.label}
        </span>
      }
      description={
        codingAgentsOnly
          ? t("providerswitcher.codingSubscriptionChatNote", {
              defaultValue:
                "Powers coding agents & workflows only — chat replies keep using your selected Intelligence provider (Cloud or Local).",
            })
          : undefined
      }
      control={
        <span className="text-xs text-accent">
          {codingAgentsOnly
            ? t("providerswitcher.activeProviderCodingAgents", {
                defaultValue: "Active for coding agents",
              })
            : t("providerswitcher.activeProvider", { defaultValue: "Active" })}
        </span>
      }
    />
  );
}
