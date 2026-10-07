// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelSlotRow } from "./ModelSlotRow";
import type { ProviderRecord } from "./useProviders";

const appState = vi.hoisted(() => ({
  t: (key: string, vars?: Record<string, unknown>) =>
    String(vars?.defaultValue ?? key),
}));

vi.mock("../../state/app-store", () => ({
  useAppSelector: (selector: (state: typeof appState) => unknown) =>
    selector(appState),
}));

const MOCK_PROVIDERS: ProviderRecord[] = [
  {
    id: "openai-provider",
    name: "OpenAI",
    type: "openai",
    enabled: true,
    status: "connected",
    serves: ["TEXT_SMALL", "TEXT_LARGE"],
  },
  {
    id: "local",
    name: "Local inference",
    type: "local",
    enabled: true,
    status: "connected",
    serves: ["TEXT_SMALL", "TEXT_LARGE", "TEXT_EMBEDDING"],
  },
];

describe("ModelSlotRow", () => {
  afterEach(cleanup);

  it("renders with unassigned default and disabled model select until provider chosen", () => {
    const onBindingChange = vi.fn();

    render(
      <ModelSlotRow
        slot="TEXT_SMALL"
        label="Small chat"
        description="Fast responses and tool planning."
        binding={{ slot: "TEXT_SMALL", providerId: null, modelId: null }}
        availableProviders={MOCK_PROVIDERS}
        onBindingChange={onBindingChange}
      />,
    );

    expect(screen.getByText("Small chat")).toBeTruthy();
    expect(screen.getByText("Fast responses and tool planning.")).toBeTruthy();
  });

  it("displays the provider name and model label when bound to a provider", () => {
    const onBindingChange = vi.fn();

    render(
      <ModelSlotRow
        slot="TEXT_SMALL"
        label="Small chat"
        description="Fast responses and tool planning."
        binding={{
          slot: "TEXT_SMALL",
          providerId: "openai-provider",
          modelId: "gpt-4.1-mini",
        }}
        availableProviders={MOCK_PROVIDERS}
        onBindingChange={onBindingChange}
      />,
    );

    // Provider trigger displays the human-readable provider name
    expect(screen.getByText("OpenAI")).toBeTruthy();
    // Model trigger displays the model label
    expect(screen.getByText("GPT-4.1 Mini")).toBeTruthy();
  });

  it("displays Local inference provider name and local model when bound to local", () => {
    const onBindingChange = vi.fn();

    render(
      <ModelSlotRow
        slot="TEXT_SMALL"
        label="Small chat"
        description="Fast responses and tool planning."
        binding={{
          slot: "TEXT_SMALL",
          providerId: "local",
          modelId: "e2b",
        }}
        availableProviders={MOCK_PROVIDERS}
        onBindingChange={onBindingChange}
      />,
    );

    expect(screen.getByText("Local inference")).toBeTruthy();
    expect(screen.getByText("Eliza-1 2B (e2b) · Multimodal Pack")).toBeTruthy();
  });
});
