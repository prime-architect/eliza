// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelSlotsTab } from "./ModelSlotsTab";

const appState = vi.hoisted(() => ({
  t: (key: string, vars?: Record<string, unknown>) =>
    String(vars?.defaultValue ?? key),
}));

vi.mock("../../state/app-store", () => ({
  useAppSelector: (selector: (state: typeof appState) => unknown) =>
    selector(appState),
}));

describe("ModelSlotsTab", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(cleanup);

  it("renders categorized model sections with default slots", () => {
    render(<ModelSlotsTab providers={[]} />);

    expect(screen.getByText("Chat Models")).toBeTruthy();
    expect(screen.getByText("Reasoning Models")).toBeTruthy();
    expect(screen.getAllByText("Embeddings").length).toBeGreaterThan(0);
    expect(screen.getByText("Speech & Audio")).toBeTruthy();
    expect(screen.getByText("Image Generation & Vision")).toBeTruthy();
    expect(screen.getByText("Advanced Slots")).toBeTruthy();
  });
});
