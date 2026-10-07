/**
 * Sticky Apply-all bar (Settings → Models & Providers → Models).
 *
 * Appears at the bottom of the Models tab whenever ≥1 slot binding is dirty.
 * Displays a concise diff preview of all pending changes, an inline restart
 * confirmation warning, and actions to apply or discard changes.
 */

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useAgentElement } from "../../agent-surface/useAgentElement";
import { useAppSelector } from "../../state/app-store";
import { Button } from "../ui/button";
import type { SavePhase, SlotDiffItem } from "./useModelSlots";

export interface ApplyAllBarProps {
  diffs: SlotDiffItem[];
  savePhase: SavePhase;
  saveErrorMessage: string | null;
  onApply: () => Promise<void>;
  onDiscard: () => void;
}

export function ApplyAllBar({
  diffs,
  savePhase,
  saveErrorMessage,
  onApply,
  onDiscard,
}: ApplyAllBarProps) {
  const t = useAppSelector((s) => s.t);
  const [confirmingRestart, setConfirmingRestart] = useState(false);

  const applyBtnAgent = useAgentElement<HTMLButtonElement>({
    id: "models-apply-restart-btn",
    role: "button",
    label: "Apply and restart",
    description:
      "Applies pending model slot changes and triggers agent restart",
  });

  const discardBtnAgent = useAgentElement<HTMLButtonElement>({
    id: "models-discard-changes-btn",
    role: "button",
    label: "Discard changes",
    description: "Reverts draft model slot bindings to last applied state",
  });

  if (diffs.length === 0 && savePhase === "idle") {
    return null;
  }

  const isBusy = savePhase === "saving" || savePhase === "restarting";

  return (
    <section
      aria-label={t("applyall.barAriaLabel", {
        defaultValue: "Unsaved model changes",
      })}
      className="sticky bottom-4 z-40 mx-auto mt-6 w-full rounded-xl border border-accent/40 bg-bg/95 p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left: Diff preview */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-accent animate-pulse" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-txt-strong">
              {t("applyall.pendingChangesHeading", {
                defaultValue: "{{count}} pending slot changes",
                count: diffs.length,
              })}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {diffs.slice(0, 3).map((d) => (
              <span
                key={d.slot}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted/15 px-2 py-0.5 text-txt-strong font-mono text-[11px]"
              >
                <span className="font-sans font-medium text-muted">
                  {d.slotLabel}:
                </span>
                <span className="text-muted line-through">{d.fromText}</span>
                <ChevronRight className="size-3 text-muted" aria-hidden />
                <span className="text-accent font-semibold">{d.toText}</span>
              </span>
            ))}
            {diffs.length > 3 ? (
              <span className="text-xs text-muted">
                +{diffs.length - 3} {t("common.more", { defaultValue: "more" })}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: Actions / Confirm */}
        <div className="flex items-center gap-2.5 shrink-0">
          {savePhase === "saving" ? (
            <span className="flex items-center gap-2 text-xs text-muted">
              <Loader2
                className="size-4 animate-spin text-accent"
                aria-hidden
              />
              {t("modelconfig.saving", { defaultValue: "Saving…" })}
            </span>
          ) : savePhase === "restarting" ? (
            <span className="flex items-center gap-2 text-xs text-accent">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("modelconfig.restarting", {
                defaultValue: "Restarting agent…",
              })}
            </span>
          ) : savePhase === "saved" ? (
            <span className="flex items-center gap-1.5 text-xs text-ok font-medium">
              <CheckCircle2 className="size-4" aria-hidden />
              {t("common.saved", { defaultValue: "Saved & Restarted" })}
            </span>
          ) : confirmingRestart ? (
            /* Inline restart warning & confirmation */
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warn/40 bg-warn/10 p-2 text-xs">
              <div className="flex items-center gap-1.5 text-warn font-medium">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                <span>
                  {t("applyall.restartWarning", {
                    defaultValue:
                      "Saving restarts the agent. Anything in progress is interrupted.",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingRestart(false)}
                  className="h-7 text-xs"
                >
                  {t("common.cancel", { defaultValue: "Cancel" })}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    setConfirmingRestart(false);
                    await onApply();
                  }}
                  className="h-7 bg-accent text-accent-fg hover:bg-accent-hover text-xs"
                >
                  {t("applyall.confirmRestart", {
                    defaultValue: "Confirm & Restart",
                  })}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDiscard}
                disabled={isBusy}
                ref={discardBtnAgent.ref}
                {...discardBtnAgent.agentProps}
                className="gap-1.5 text-xs"
              >
                <Undo2 className="size-3.5" aria-hidden />
                {t("common.discard", { defaultValue: "Discard" })}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setConfirmingRestart(true)}
                disabled={isBusy}
                ref={applyBtnAgent.ref}
                {...applyBtnAgent.agentProps}
                className="gap-1.5 text-xs"
              >
                {t("applyall.applyAndRestart", {
                  defaultValue: "Apply & restart",
                })}
              </Button>
            </>
          )}
        </div>
      </div>

      {saveErrorMessage ? (
        <div role="alert" className="mt-2 text-xs text-destructive">
          {saveErrorMessage}
        </div>
      ) : null}
    </section>
  );
}
