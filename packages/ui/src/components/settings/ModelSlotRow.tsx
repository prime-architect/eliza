/**
 * ModelSlotRow component (Settings → Models & Providers → Models).
 *
 * Renders a single model capability slot (e.g. TEXT_SMALL, TEXT_LARGE) with:
 * 1. Provider selector: filtered to added, enabled providers whose `serves` capability includes the slot.
 * 2. Model selector: filtered to the selected provider's models available for this slot, showing cost hints.
 *
 * Both controls default to "Not assigned" / "Choose model…".
 */

import { useMemo } from "react";
import { useAppSelector } from "../../state/app-store";
import {
  SettingsSelectRow,
  type SettingsSelectRowOption,
} from "./settings-agent-rows";
import type { SlotBinding } from "./useModelSlots";
import {
  type LocalEngineInfo,
  type ProviderRecord,
  SEED_MODELS_BY_TYPE,
} from "./useProviders";

export interface ModelSlotRowProps {
  slot: string;
  label: string;
  description: string;
  binding?: SlotBinding;
  availableProviders: ProviderRecord[];
  localEngine?: LocalEngineInfo;
  onBindingChange: (binding: SlotBinding) => void;
  disabled?: boolean;
}

export function ModelSlotRow({
  slot,
  label,
  description,
  binding,
  availableProviders,
  localEngine,
  onBindingChange,
  disabled = false,
}: ModelSlotRowProps) {
  const t = useAppSelector((s) => s.t);

  const selectedProviderId = binding?.providerId ?? "";
  const selectedModelId = binding?.modelId ?? "";

  const isAdvancedSlot = useMemo(() => {
    return [
      "ACTION_PLANNER",
      "RESPONSE_HANDLER",
      "TEXT_COMPLETION",
      "PII_SCRUB",
      "RESEARCH",
    ].includes(slot);
  }, [slot]);

  // Find the selected provider either by exact id or by type slug
  const selectedProvider = useMemo(() => {
    if (!selectedProviderId || selectedProviderId === "__unassigned__") {
      return undefined;
    }
    return availableProviders.find(
      (p) => p.id === selectedProviderId || p.type === selectedProviderId,
    );
  }, [availableProviders, selectedProviderId]);

  // 1. Providers that are enabled and serve this slot (or keep current provider visible)
  const validProviders = useMemo(() => {
    return availableProviders.filter((p) => {
      if (!p.enabled) return false;
      if (selectedProvider && p.id === selectedProvider.id) return true;
      if (p.serves.length === 0 || p.serves.includes(slot)) return true;
      if (
        isAdvancedSlot &&
        (p.serves.includes("TEXT_SMALL") || p.serves.includes("TEXT_LARGE"))
      ) {
        return true;
      }
      return false;
    });
  }, [availableProviders, slot, isAdvancedSlot, selectedProvider]);

  const providerOptions = useMemo<SettingsSelectRowOption[]>(() => {
    const unassignedOption: SettingsSelectRowOption = {
      value: "__unassigned__",
      label: t("modelslot.notAssigned", { defaultValue: "Not assigned" }),
    };

    const options: SettingsSelectRowOption[] = validProviders.map((p) => {
      let hint: string | undefined = p.type;
      if (p.baseUrl) {
        try {
          hint = new URL(p.baseUrl).hostname;
        } catch {
          hint = p.baseUrl;
        }
      } else if (p.type === "local") {
        hint = t("modelslot.localHint", { defaultValue: "on-device" });
      }
      return {
        value: p.id,
        label: p.name,
        hint,
      };
    });

    return [unassignedOption, ...options];
  }, [validProviders, t]);

  // The current provider value matches the option id so the trigger displays the provider name
  const currentProviderValue = selectedProvider
    ? selectedProvider.id
    : "__unassigned__";

  // 2. Models available for this provider + slot
  const modelOptions = useMemo<SettingsSelectRowOption[]>(() => {
    if (!selectedProvider) return [];

    const unassignedOption: SettingsSelectRowOption = {
      value: "__unassigned__",
      label: t("modelslot.notAssigned", { defaultValue: "Not assigned" }),
    };

    const seedList = SEED_MODELS_BY_TYPE[selectedProvider.type] || [];
    const modelsForSlot = seedList.filter((m) => {
      if (m.serves.length === 0) return true;
      if (m.serves.includes(slot)) return true;
      if (
        isAdvancedSlot &&
        (m.serves.includes("TEXT_SMALL") ||
          m.serves.includes("TEXT_LARGE") ||
          m.serves.includes("TEXT_MEDIUM"))
      ) {
        return true;
      }
      return false;
    });

    const seedOptions: SettingsSelectRowOption[] = modelsForSlot.map((m) => ({
      value: m.id,
      label: m.label,
      hint: m.costHint,
    }));

    // If local provider and we have installed models, include them
    if (selectedProvider.type === "local" && localEngine?.installedModels) {
      for (const inst of localEngine.installedModels) {
        if (!seedOptions.some((o) => o.value === inst.id)) {
          seedOptions.push({
            value: inst.id,
            label: inst.displayName || inst.id,
            hint: t("modelslot.installedHint", { defaultValue: "Installed" }),
          });
        }
      }
    }

    // If provider has customModels defined, add them
    const customList: SettingsSelectRowOption[] = (
      selectedProvider.customModels || []
    ).map((modelName) => ({
      value: modelName,
      label: modelName,
      hint: t("modelslot.customModel", { defaultValue: "Custom" }),
    }));

    const result = [unassignedOption, ...seedOptions, ...customList];

    // If a model is currently assigned and not yet in the list, keep it visible
    if (
      selectedModelId &&
      selectedModelId !== "__unassigned__" &&
      !result.some((o) => o.value === selectedModelId)
    ) {
      result.splice(1, 0, {
        value: selectedModelId,
        label: selectedModelId,
        hint: t("modelslot.currentModel", { defaultValue: "Current" }),
      });
    }

    return result;
  }, [selectedProvider, slot, isAdvancedSlot, localEngine, selectedModelId, t]);

  const currentModelValue =
    selectedModelId && selectedModelId !== "__unassigned__"
      ? selectedModelId
      : "__unassigned__";

  const handleProviderChange = (newProviderId: string) => {
    if (newProviderId === selectedProvider?.id) return;
    if (!newProviderId || newProviderId === "__unassigned__") {
      onBindingChange({ slot, providerId: null, modelId: null });
      return;
    }
    // Provider changed: reset model until explicitly picked
    onBindingChange({ slot, providerId: newProviderId, modelId: null });
  };

  const handleModelChange = (newModelId: string) => {
    const nextModelId =
      !newModelId || newModelId === "__unassigned__" ? null : newModelId;
    onBindingChange({
      slot,
      providerId: selectedProvider ? selectedProvider.id : null,
      modelId: nextModelId,
    });
  };

  const slotKey = slot.toLowerCase().replace(/_/g, "-");

  return (
    <div className="space-y-2 border-b border-border/40 py-3 last:border-b-0">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-txt-strong">{label}</h4>
        <p className="text-xs text-muted">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Provider selector */}
        <SettingsSelectRow
          agentId={`slot-provider-${slotKey}`}
          label={t("modelslot.providerLabel", { defaultValue: "Provider" })}
          value={currentProviderValue}
          onValueChange={handleProviderChange}
          options={providerOptions}
          placeholder={t("modelslot.notAssigned", {
            defaultValue: "Not assigned",
          })}
          disabled={disabled || validProviders.length === 0}
        />

        {/* Model selector */}
        <SettingsSelectRow
          agentId={`slot-model-${slotKey}`}
          label={t("modelslot.modelLabel", { defaultValue: "Model" })}
          value={currentModelValue}
          onValueChange={handleModelChange}
          options={modelOptions}
          placeholder={
            !selectedProvider
              ? t("modelslot.chooseProviderFirst", {
                  defaultValue: "Choose provider first…",
                })
              : t("modelslot.chooseModel", {
                  defaultValue: "Choose model…",
                })
          }
          disabled={disabled || !selectedProvider}
        />
      </div>
    </div>
  );
}
