/** Covers provider-panel selection controls and their distinct degraded states. */

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiKeyPanel,
  LocalProviderPanel,
  SubscriptionPanel,
} from "./ProviderPanels";

const appState = vi.hoisted(() => ({
  t: (key: string, vars?: Record<string, unknown>) =>
    String(vars?.defaultValue ?? key),
  setActionNotice: vi.fn(),
}));

vi.mock("../../state/app-store", () => ({
  useAppSelector: (selector: (state: typeof appState) => unknown) =>
    selector(appState),
}));

beforeEach(() => {
  appState.setActionNotice.mockClear();
});

vi.mock("../accounts/AccountList", () => ({
  AccountList: ({ providerId }: { providerId: string }) => (
    <div>accounts:{providerId}</div>
  ),
}));

vi.mock("../local-inference/LocalInferencePanel", () => ({
  LocalInferencePanel: () => <div>local inference</div>,
}));

vi.mock("./ApiKeyConfig", () => ({
  ApiKeyConfig: () => <div>api key config</div>,
}));

vi.mock("./settings-agent-rows", () => ({
  SettingsActionButton: ({
    agentId: _agentId,
    agentStatus: _agentStatus,
    agentLabel: _agentLabel,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    agentId?: string;
    agentStatus?: string;
    agentLabel?: string;
  }) => <button {...props} />,
}));

afterEach(cleanup);

describe("ProviderPanels", () => {
  it("activates local routing", () => {
    const local = vi.fn();
    const { container } = render(
      <LocalProviderPanel
        cloudCallsDisabled={false}
        routingModeSaving={false}
        onSelectLocalOnly={local}
        runtime="local"
      />,
    );
    expect(container.firstElementChild?.className).toContain("min-h-[28rem]");
    expect(container.firstElementChild?.className).toContain(
      "sm:min-h-[32rem]",
    );
    fireEvent.click(screen.getByRole("button", { name: "Use local only" }));
    expect(local).toHaveBeenCalled();
  });

  it("shows and activates a paused subscription", () => {
    const select = vi.fn().mockResolvedValue(undefined);
    render(
      <SubscriptionPanel
        selection={
          {
            id: "kimi-coding-subscription",
            storedProvider: "kimi-coding",
            labelKey: "Kimi Code",
          } as never
        }
        visibleProviderPanelId="kimi-coding-subscription"
        resolvedSelectedId="kimi-coding-subscription"
        cloudCallsDisabled
        onSelectSubscription={select}
      />,
    );
    expect(screen.getByText(/remote routing is paused/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use subscription" }));
    expect(select).toHaveBeenCalledWith("kimi-coding-subscription");
    expect(screen.getByText("accounts:kimi-coding")).toBeTruthy();
  });

  it("shows and activates a paused API-key provider", () => {
    const select = vi.fn();
    render(
      <ApiKeyPanel
        selectedProvider={{ id: "plugin-openai" } as never}
        panelLabel="OpenAI"
        visibleProviderPanelId="plugin-openai"
        resolvedSelectedId={null}
        cloudCallsDisabled
        onSwitchProvider={select}
        pluginSaving={new Set()}
        pluginSaveSuccess={new Set()}
        handlePluginConfigSave={vi.fn()}
        loadPlugins={vi.fn()}
      />,
    );
    expect(screen.getByText(/remote routing is paused/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use provider" }));
    expect(select).toHaveBeenCalledWith("plugin-openai");
    expect(screen.getByText("api key config")).toBeTruthy();
  });

  it("keeps on-device model management out of a remote runtime panel", () => {
    render(
      <LocalProviderPanel
        cloudCallsDisabled
        routingModeSaving={false}
        onSelectLocalOnly={vi.fn()}
        runtime="remote"
      />,
    );
    expect(screen.getByText("Ready on your remote host.")).toBeTruthy();
    expect(screen.queryByText("local inference")).toBeNull();
  });
});
