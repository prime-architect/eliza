// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApplyAllBar } from "./ApplyAllBar";
import type { SlotDiffItem } from "./useModelSlots";

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

const SAMPLE_DIFFS: SlotDiffItem[] = [
  {
    slot: "TEXT_SMALL",
    slotLabel: "Small chat",
    fromText: "Not assigned",
    toText: "Nararouter · mimo-v2.5",
  },
];

describe("ApplyAllBar", () => {
  afterEach(cleanup);

  it("renders nothing when there are zero diffs and idle", () => {
    const { container } = render(
      <ApplyAllBar
        diffs={[]}
        savePhase="idle"
        saveErrorMessage={null}
        onApply={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders diffs and prompts for confirmation before calling onApply", async () => {
    const onApply = vi.fn().mockResolvedValue(undefined);
    const onDiscard = vi.fn();

    render(
      <ApplyAllBar
        diffs={SAMPLE_DIFFS}
        savePhase="idle"
        saveErrorMessage={null}
        onApply={onApply}
        onDiscard={onDiscard}
      />,
    );

    expect(screen.getByText("Small chat:")).toBeTruthy();
    expect(screen.getByText("Nararouter · mimo-v2.5")).toBeTruthy();

    const applyBtn = screen.getByRole("button", { name: /Apply and restart/i });
    fireEvent.click(applyBtn);

    expect(
      screen.getByText(
        /Saving restarts the agent. Anything in progress is interrupted./i,
      ),
    ).toBeTruthy();

    const confirmBtn = screen.getByRole("button", {
      name: /Confirm & Restart/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1);
    });
  });
});
