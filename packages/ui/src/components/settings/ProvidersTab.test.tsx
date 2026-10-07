// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProvidersTab } from "./ProvidersTab";

const appState = vi.hoisted(() => ({
  t: (key: string, vars?: Record<string, unknown>) => {
    let str = String(vars?.defaultValue ?? key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{{${k}}}`, String(v));
      }
    }
    return str;
  },
}));

vi.mock("../../state/app-store", () => ({
  useAppSelector: (selector: (state: typeof appState) => unknown) =>
    selector(appState),
}));

describe("ProvidersTab", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(cleanup);

  it("renders built-in local engine card and empty state when fresh", () => {
    render(<ProvidersTab />);

    expect(screen.getByText("Local inference")).toBeTruthy();
    expect(screen.getByText(/Engine ready/i)).toBeTruthy();
    expect(screen.getByText("No providers yet")).toBeTruthy();
  });

  it("opens add provider wizard when Add provider is clicked", () => {
    render(<ProvidersTab />);

    const addButtons = screen.getAllByRole("button", { name: /Add provider/i });
    fireEvent.click(addButtons[0]);

    expect(screen.getByText("1. Select Provider Type")).toBeTruthy();
  });
});
