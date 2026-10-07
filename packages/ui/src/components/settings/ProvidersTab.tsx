/**
 * Providers Tab (Settings → Models & Providers → Providers).
 *
 * Surfaces:
 * 1. Built-in Local inference card (engine availability, models count, detail view link).
 * 2. User-configured providers list with status dots, capability chips, enable/disable toggle,
 *    and removal with confirmation (which triggers slot unassignment).
 * 3. Empty state when no custom providers have been added yet.
 * 4. Add Provider button launching AddProviderWizard.
 */

import {
  AlertTriangle,
  Bot,
  Cpu,
  Globe,
  Mic,
  Plus,
  Server,
  Sparkles,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { useAgentElement } from "../../agent-surface/useAgentElement";
import { useAppSelector } from "../../state/app-store";
import { cn } from "../../utils/cn";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { AddProviderWizard } from "./AddProviderWizard";
import {
  type ProviderRecord,
  type ProviderType,
  useProviders,
} from "./useProviders";

export interface ProvidersTabProps {
  onNavigateToLocalDetail?: () => void;
  onProviderRemoved?: (providerId: string) => void;
}

const TYPE_ICONS: Record<
  ProviderType,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  local: Cpu,
  openai: Sparkles,
  anthropic: Bot,
  google: Globe,
  "openai-compatible": Server,
  ollama: Server,
  deepgram: Mic,
  custom: Server,
};

const STATUS_DOT_CLASSES: Record<ProviderRecord["status"], string> = {
  connected: "bg-ok",
  error: "bg-destructive",
  untested: "bg-muted/50",
};

export function ProvidersTab({
  onNavigateToLocalDetail,
  onProviderRemoved,
}: ProvidersTabProps) {
  const t = useAppSelector((s) => s.t);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingDeleteProvider, setPendingDeleteProvider] =
    useState<ProviderRecord | null>(null);

  const {
    providers,
    localEngine,
    addProvider,
    toggleProvider,
    removeProvider,
  } = useProviders(onProviderRemoved);

  const addBtnAgent = useAgentElement<HTMLButtonElement>({
    id: "models-add-provider-btn",
    role: "button",
    label: "Add provider",
    description: "Opens provider addition modal",
  });

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteProvider) return;
    await removeProvider(pendingDeleteProvider.id);
    setPendingDeleteProvider(null);
  }, [pendingDeleteProvider, removeProvider]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-base font-semibold text-txt-strong">
            {t("providerstab.title", { defaultValue: "Inference Providers" })}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {t("providerstab.subtitle", {
              defaultValue:
                "Configure local and remote model backends. Models are assigned to slots in the Models tab.",
            })}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setWizardOpen(true)}
          ref={addBtnAgent.ref}
          {...addBtnAgent.agentProps}
          className="gap-2 text-xs"
        >
          <Plus className="size-4" aria-hidden />
          {t("providerstab.addProvider", { defaultValue: "Add provider" })}
        </Button>
      </div>

      {/* Built-in Local Inference Card */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t("providerstab.builtInHeading", {
            defaultValue: "Built-in engine",
          })}
        </span>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/80 bg-muted/5 p-4 transition-colors hover:border-border">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Cpu className="size-5" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-txt-strong">
                  {t("providerstab.localEngineTitle", {
                    defaultValue: "Local inference",
                  })}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted font-normal">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      localEngine.available ? "bg-ok" : "bg-muted/50",
                    )}
                    aria-hidden
                  />
                  {localEngine.available
                    ? t("providerstab.engineReady", {
                        defaultValue: "Engine ready",
                      })
                    : t("providerstab.engineOffline", {
                        defaultValue: "Engine offline",
                      })}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {t("providerstab.localEngineSummary", {
                  defaultValue:
                    "{{count}} models downloaded · Eliza-1 multimodal bundles and GGUFs",
                  count: localEngine.downloadedCount,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNavigateToLocalDetail}
              className="text-xs"
            >
              {t("providerstab.manageLocalModels", {
                defaultValue: "Manage local models",
              })}
            </Button>
          </div>
        </div>
      </div>

      {/* User-Configured Providers List */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t("providerstab.configuredHeading", {
            defaultValue: "Configured providers",
          })}
        </span>

        {providers.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-8 text-center bg-muted/5">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/10 text-muted mb-3">
              <Server className="size-6" aria-hidden />
            </div>
            <h3 className="text-sm font-medium text-txt-strong">
              {t("providerstab.noProvidersYet", {
                defaultValue: "No providers yet",
              })}
            </h3>
            <p className="text-xs text-muted max-w-sm mt-1 mb-4">
              {t("providerstab.noProvidersCopy", {
                defaultValue:
                  "Add a provider to start assigning models to chat, speech, embeddings, and reasoning slots.",
              })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWizardOpen(true)}
              className="gap-2 text-xs"
            >
              <Plus className="size-3.5" aria-hidden />
              {t("providerstab.addProvider", { defaultValue: "Add provider" })}
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {providers.map((p) => {
              const Icon = TYPE_ICONS[p.type] || Server;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 transition-colors",
                    p.enabled
                      ? "border-border/80 bg-bg"
                      : "border-border/40 bg-muted/5 opacity-70",
                  )}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/10 text-muted mt-0.5">
                      <Icon className="size-4.5" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-txt-strong truncate">
                          {p.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              STATUS_DOT_CLASSES[p.status],
                            )}
                            aria-hidden
                          />
                          {p.status}
                        </span>
                        {p.baseUrl ? (
                          <span className="text-[11px] font-mono text-muted truncate max-w-[200px]">
                            {p.baseUrl}
                          </span>
                        ) : null}
                      </div>

                      {/* Capabilities chips */}
                      <div className="flex flex-wrap gap-1">
                        {p.serves.map((slot) => (
                          <span
                            key={slot}
                            className="inline-block rounded-md bg-muted/15 px-2 py-0.5 text-[10px] font-medium text-txt-strong"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">
                        {p.enabled
                          ? t("common.enabled", { defaultValue: "Enabled" })
                          : t("common.disabled", { defaultValue: "Disabled" })}
                      </span>
                      <Switch
                        checked={p.enabled}
                        onCheckedChange={(checked) =>
                          toggleProvider(p.id, checked)
                        }
                        aria-label={t("providerstab.toggleProvider", {
                          defaultValue: "Toggle {{name}}",
                          name: p.name,
                        })}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteProvider(p)}
                      aria-label={t("providerstab.removeProvider", {
                        defaultValue: "Remove {{name}}",
                        name: p.name,
                      })}
                      className="text-muted hover:text-destructive hover:bg-destructive/10 size-8 p-0"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      <AddProviderWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSave={async (record) => {
          await addProvider(record);
        }}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={pendingDeleteProvider !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteProvider(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" aria-hidden />
              {t("providerstab.deleteConfirmTitle", {
                defaultValue: "Remove Provider",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("providerstab.deleteConfirmBody", {
                defaultValue:
                  "Removing {{name}} will unassign all its models from active slots. Slots will revert to Not assigned without silent fallbacks.",
                name: pendingDeleteProvider?.name ?? "this provider",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingDeleteProvider(null)}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              {t("providerstab.confirmDelete", {
                defaultValue: "Remove & Unassign",
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
