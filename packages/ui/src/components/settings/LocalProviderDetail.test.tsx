// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalProviderDetail } from "./LocalProviderDetail";

const appState = vi.hoisted(() => ({
  t: (key: string, vars?: Record<string, unknown>) =>
    String(vars?.defaultValue ?? key),
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

describe("LocalProviderDetail", () => {
  afterEach(cleanup);

  it("renders curated Eliza-1 models with parameters and download actions", () => {
    render(<LocalProviderDetail onBack={vi.fn()} />);

    expect(screen.getByText("Local Inference Engine")).toBeTruthy();
    expect(screen.getByText("Curated Eliza-1 Bundles")).toBeTruthy();
    expect(screen.getByText("Eliza-1 2B Multimodal Pack")).toBeTruthy();
    expect(screen.getByText("Eliza-1 4B Full Pack")).toBeTruthy();
    expect(screen.getByText("Eliza-1 12B Text")).toBeTruthy();
    expect(screen.getByText("Eliza-1 31B Large Text")).toBeTruthy();
    expect(screen.getByTestId("local-inference-stub")).toBeTruthy();
  });
});
