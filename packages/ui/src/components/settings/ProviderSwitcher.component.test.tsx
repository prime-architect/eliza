/** Exercises the provider switcher's tab container composition and navigation wiring. */

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderSwitcher } from "./ProviderSwitcher";

const appState = vi.hoisted(() => ({
  t: (key: string, vars?: Record<string, unknown>) =>
    String(vars?.defaultValue ?? key),
  setActionNotice: vi.fn(),
}));

vi.mock("../../state/app-store", () => ({
  useAppSelector: (selector: (state: typeof appState) => unknown) =>
    selector(appState),
  useAppSelectorShallow: (selector: (state: typeof appState) => unknown) =>
    selector(appState),
}));

vi.mock("../local-inference/LocalInferencePanel", () => ({
  LocalInferencePanel: () => (
    <div data-testid="local-inference-stub">Engine Hub</div>
  ),
}));

describe("ProviderSwitcher tab container", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(cleanup);

  it("renders with Providers tab active by default and switches to Models tab", () => {
    render(<ProviderSwitcher />);

    // Header and tab buttons present
    expect(screen.getByText("Models & Providers")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Providers tab/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Models tab/i })).toBeTruthy();

    // Default Providers tab content
    expect(screen.getByText("Inference Providers")).toBeTruthy();
    expect(screen.getByText("Local inference")).toBeTruthy();

    // Click Models tab
    const modelsTabBtn = screen.getByRole("button", { name: /Models tab/i });
    fireEvent.click(modelsTabBtn);

    // Shows Models tab content
    expect(screen.getByText("Model Slot Assignments")).toBeTruthy();
    expect(screen.getByText("Chat Models")).toBeTruthy();
    expect(screen.getByText("Reasoning Models")).toBeTruthy();
  });

  it("navigates into Local detail view and returns on back click", () => {
    render(<ProviderSwitcher />);

    const manageBtn = screen.getByRole("button", {
      name: /Manage local models/i,
    });
    fireEvent.click(manageBtn);

    // Detail view shown
    expect(screen.getByText("Local Inference Engine")).toBeTruthy();
    expect(screen.getByText("Curated Eliza-1 Bundles")).toBeTruthy();

    // Click back
    const backBtn = screen.getByRole("button", { name: /Back to Providers/i });
    fireEvent.click(backBtn);

    // Back in Providers tab
    expect(screen.getByText("Inference Providers")).toBeTruthy();
  });
});
