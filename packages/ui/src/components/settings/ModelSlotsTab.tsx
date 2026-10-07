/**
 * Models Tab (Settings → Models & Providers → Models).
 *
 * Renders categorized capability slots (Chat, Reasoning, Embeddings, Speech, Image, Advanced)
 * and coordinates draft changes with the sticky ApplyAllBar.
 */

import {
  Brain,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  MessageSquare,
  Mic,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAppSelector } from "../../state/app-store";
import { ApplyAllBar } from "./ApplyAllBar";
import { ModelSlotRow } from "./ModelSlotRow";
import {
  MODEL_SLOTS,
  type SlotDefinition,
  type UseModelSlotsResult,
  useModelSlots,
} from "./useModelSlots";
import { type ProviderRecord, useProviders } from "./useProviders";

export interface ModelSlotsTabProps {
  providers?: ProviderRecord[];
  modelSlotsHook?: UseModelSlotsResult;
}

export function ModelSlotsTab({
  providers: propProviders,
  modelSlotsHook,
}: ModelSlotsTabProps) {
  const t = useAppSelector((s) => s.t);
  const { allProviders, localEngine } = useProviders();
  const availableProviders = propProviders ?? allProviders;

  const fallbackModelSlots = useModelSlots();
  const {
    draftBindings,
    diffs,
    savePhase,
    saveErrorMessage,
    setBinding,
    discardAll,
    applyAll,
  } = modelSlotsHook ?? fallbackModelSlots;

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const chatSlots = MODEL_SLOTS.filter((s) => s.section === "chat");
  const reasoningSlots = MODEL_SLOTS.filter((s) => s.section === "reasoning");
  const embeddingsSlots = MODEL_SLOTS.filter((s) => s.section === "embeddings");
  const speechSlots = MODEL_SLOTS.filter((s) => s.section === "speech");
  const imageSlots = MODEL_SLOTS.filter((s) => s.section === "image");
  const advancedSlots = MODEL_SLOTS.filter((s) => s.section === "advanced");

  const renderSlotGroup = (
    title: string,
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>,
    slots: SlotDefinition[],
  ) => {
    const Icon = icon;
    return (
      <div className="rounded-xl border border-border/70 bg-bg p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 border-b border-border/40 pb-2.5">
          <Icon className="size-4 text-accent" aria-hidden />
          <h3 className="text-sm font-semibold text-txt-strong">{title}</h3>
        </div>
        <div className="divide-y divide-border/30">
          {slots.map((s) => (
            <ModelSlotRow
              key={s.slot}
              slot={s.slot}
              label={s.label}
              description={s.description}
              binding={draftBindings[s.slot]}
              availableProviders={availableProviders}
              localEngine={localEngine}
              onBindingChange={(b) =>
                setBinding(b.slot, b.providerId, b.modelId)
              }
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header explanation */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-base font-semibold text-txt-strong">
          {t("modelslotstab.title", { defaultValue: "Model Slot Assignments" })}
        </h2>
        <p className="text-xs text-muted mt-0.5">
          {t("modelslotstab.subtitle", {
            defaultValue:
              "Assign specific models to specialized agent capabilities. All slots default to Not assigned.",
          })}
        </p>
      </div>

      {/* Main slot groups */}
      <div className="space-y-4">
        {/* Chat Slots */}
        {renderSlotGroup(
          t("modelslotstab.chatHeading", { defaultValue: "Chat Models" }),
          MessageSquare,
          chatSlots,
        )}

        {/* Reasoning Slots */}
        {renderSlotGroup(
          t("modelslotstab.reasoningHeading", {
            defaultValue: "Reasoning Models",
          }),
          Brain,
          reasoningSlots,
        )}

        {/* Embeddings Slots */}
        {renderSlotGroup(
          t("modelslotstab.embeddingsHeading", { defaultValue: "Embeddings" }),
          Sparkles,
          embeddingsSlots,
        )}

        {/* Speech Slots */}
        {renderSlotGroup(
          t("modelslotstab.speechHeading", { defaultValue: "Speech & Audio" }),
          Mic,
          speechSlots,
        )}

        {/* Image Slots */}
        {renderSlotGroup(
          t("modelslotstab.imageHeading", {
            defaultValue: "Image Generation & Vision",
          }),
          ImageIcon,
          imageSlots,
        )}

        {/* Advanced Slots (Collapsible) */}
        <div className="rounded-xl border border-border/60 bg-muted/5 overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/10"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="size-4 text-muted" aria-hidden />
              <div>
                <span className="text-sm font-semibold text-txt-strong">
                  {t("modelslotstab.advancedHeading", {
                    defaultValue: "Advanced Slots",
                  })}
                </span>
                <p className="text-[11px] text-muted">
                  {t("modelslotstab.advancedDescription", {
                    defaultValue:
                      "Action planner, Response handler, Completion, PII scrub, Research (inherits Small/Large unless overridden)",
                  })}
                </p>
              </div>
            </div>
            {advancedOpen ? (
              <ChevronDown className="size-4 text-muted" aria-hidden />
            ) : (
              <ChevronRight className="size-4 text-muted" aria-hidden />
            )}
          </button>

          {advancedOpen ? (
            <div className="border-t border-border/40 p-4 bg-bg divide-y divide-border/30">
              {advancedSlots.map((s) => (
                <ModelSlotRow
                  key={s.slot}
                  slot={s.slot}
                  label={s.label}
                  description={s.description}
                  binding={draftBindings[s.slot]}
                  availableProviders={availableProviders}
                  localEngine={localEngine}
                  onBindingChange={(b) =>
                    setBinding(b.slot, b.providerId, b.modelId)
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky Apply All Bar */}
      <ApplyAllBar
        diffs={diffs}
        savePhase={savePhase}
        saveErrorMessage={saveErrorMessage}
        onApply={async () => {
          await applyAll(availableProviders);
        }}
        onDiscard={discardAll}
      />
    </div>
  );
}
