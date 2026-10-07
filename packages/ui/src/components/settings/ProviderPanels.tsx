/**
 * Provider-specific bodies for local inference, cloud routing, coding
 * subscriptions, and API keys. The parent owns selection state while each
 * panel exposes an agent-addressable activation control. An unsigned-in
 * Cloud panel signs the user in rather than pretending the route is live.
 */

import type {
  SUBSCRIPTION_PROVIDER_SELECTIONS,
  SubscriptionProviderSelectionId,
} from "@elizaos/host/protocol";
import { Cpu, KeyRound, ShieldCheck } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useAppSelector } from "../../state/app-store";
import { AccountList } from "../accounts/AccountList";
import { LocalInferencePanel } from "../local-inference/LocalInferencePanel";
import { ApiKeyConfig } from "./ApiKeyConfig";
import type { ServingAxes } from "./resolveServingAxes";
import { SettingsActionButton } from "./settings-agent-rows";
import type { PluginInfo } from "./useProviderEntries";

type SubscriptionProviderSelection =
  (typeof SUBSCRIPTION_PROVIDER_SELECTIONS)[number];

function ProviderPanelHeader({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex min-h-[3rem] flex-wrap items-center justify-between gap-2 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-[18px] shrink-0 text-muted/80" aria-hidden />
        <h3 className="truncate text-sm font-medium leading-5 text-txt-strong">
          {title}
        </h3>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}

export function LocalProviderPanel({
  cloudCallsDisabled,
  routingModeSaving,
  onSelectLocalOnly,
  runtime,
}: {
  cloudCallsDisabled: boolean;
  routingModeSaving: boolean;
  onSelectLocalOnly: () => void;
  runtime: ServingAxes["runtime"];
}) {
  const t = useAppSelector((s) => s.t);
  const remoteRuntime = runtime === "remote";
  return (
    <div
      className={
        remoteRuntime ? "min-w-0" : "min-h-[28rem] min-w-0 sm:min-h-[32rem]"
      }
    >
      <ProviderPanelHeader
        icon={Cpu}
        title={t("providerpanels.localProvider", {
          defaultValue: "Local provider",
        })}
      >
        <SettingsActionButton
          agentId="local-use-local-only"
          agentStatus={cloudCallsDisabled ? "active" : undefined}
          type="button"
          variant={cloudCallsDisabled ? "default" : "outline"}
          className="h-9 rounded-md px-3 text-xs font-medium"
          disabled={routingModeSaving}
          aria-label={
            cloudCallsDisabled
              ? t("providerpanels.localOnlyActive", {
                  defaultValue: "Local only active",
                })
              : t("providerpanels.useLocalOnly", {
                  defaultValue: "Use local only",
                })
          }
          onClick={onSelectLocalOnly}
        >
          <ShieldCheck className="size-4" aria-hidden />
          {t("providerpanels.localOnly", { defaultValue: "Local only" })}
        </SettingsActionButton>
      </ProviderPanelHeader>
      <div className="p-3 sm:px-4">
        {remoteRuntime ? (
          <p className="text-sm text-muted">
            {t("providerpanels.remoteHostReady", {
              defaultValue: "Ready on your remote host.",
            })}
          </p>
        ) : (
          <LocalInferencePanel />
        )}
      </div>
    </div>
  );
}
export interface SubscriptionPanelProps {
  selection: SubscriptionProviderSelection;
  visibleProviderPanelId: string;
  resolvedSelectedId: string | null;
  cloudCallsDisabled: boolean;
  onSelectSubscription: (
    providerId: SubscriptionProviderSelectionId,
    activate?: boolean,
  ) => Promise<void>;
}
export function SubscriptionPanel({
  selection,
  visibleProviderPanelId,
  resolvedSelectedId,
  cloudCallsDisabled,
  onSelectSubscription,
}: SubscriptionPanelProps) {
  const t = useAppSelector((s) => s.t);
  const showUseButton =
    cloudCallsDisabled || resolvedSelectedId !== visibleProviderPanelId;
  return (
    <div className="min-w-0">
      <ProviderPanelHeader
        icon={KeyRound}
        title={t(selection.labelKey, { defaultValue: selection.id })}
      >
        {showUseButton ? (
          <SettingsActionButton
            agentId={`sub-use-${selection.id}`}
            type="button"
            variant="outline"
            className="h-9 rounded-md px-3 text-xs font-medium"
            onClick={() => void onSelectSubscription(selection.id)}
          >
            {t("providerpanels.useSubscription", {
              defaultValue: "Use subscription",
            })}
          </SettingsActionButton>
        ) : null}
      </ProviderPanelHeader>
      <div className="p-3 sm:px-4">
        {cloudCallsDisabled ? (
          <div className="mb-3 rounded-sm border border-warn/30 bg-warn/5 px-3 py-2 text-warn text-xs">
            {t("providerpanels.localOnlySubscriptionPaused", {
              defaultValue: "Local only is active. Remote routing is paused.",
            })}
          </div>
        ) : null}
        <p className="mb-2 text-xs text-muted">
          Add and manage subscription accounts below. Login state is preserved
          while an external browser or device authorization is active.
        </p>
        <AccountList providerId={selection.storedProvider} />
      </div>
    </div>
  );
}
export interface ApiKeyPanelProps {
  selectedProvider: PluginInfo;
  panelLabel: string;
  visibleProviderPanelId: string;
  resolvedSelectedId: string | null;
  cloudCallsDisabled: boolean;
  onSwitchProvider: (id: string) => void;
  pluginSaving: Set<string>;
  pluginSaveSuccess: Set<string>;
  handlePluginConfigSave: (
    pluginId: string,
    values: Record<string, string>,
  ) => void;
  loadPlugins: () => Promise<void>;
}
export function ApiKeyPanel({
  selectedProvider,
  panelLabel,
  visibleProviderPanelId,
  resolvedSelectedId,
  cloudCallsDisabled,
  onSwitchProvider,
  pluginSaving,
  pluginSaveSuccess,
  handlePluginConfigSave,
  loadPlugins,
}: ApiKeyPanelProps) {
  const t = useAppSelector((s) => s.t);
  const showUseButton =
    cloudCallsDisabled || resolvedSelectedId !== visibleProviderPanelId;
  return (
    <div className="min-w-0">
      <ProviderPanelHeader icon={KeyRound} title={panelLabel}>
        {showUseButton ? (
          <SettingsActionButton
            agentId={`apikey-use-${visibleProviderPanelId}`}
            type="button"
            variant="outline"
            className="h-9 rounded-md px-3 text-xs font-medium"
            onClick={() => onSwitchProvider(visibleProviderPanelId)}
          >
            {t("providerpanels.useProvider", { defaultValue: "Use provider" })}
          </SettingsActionButton>
        ) : null}
      </ProviderPanelHeader>
      <div className="p-3 sm:px-4">
        {cloudCallsDisabled ? (
          <div className="mb-3 rounded-sm border border-warn/30 bg-warn/5 px-3 py-2 text-warn text-xs">
            {t("providerpanels.localOnlyApiPaused", {
              defaultValue: "Local only is active. Remote routing is paused.",
            })}
          </div>
        ) : null}
        <ApiKeyConfig
          selectedProvider={selectedProvider}
          pluginSaving={pluginSaving}
          pluginSaveSuccess={pluginSaveSuccess}
          handlePluginConfigSave={handlePluginConfigSave}
          loadPlugins={loadPlugins}
        />
      </div>
    </div>
  );
}
