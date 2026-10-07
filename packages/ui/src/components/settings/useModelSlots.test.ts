// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useModelSlots } from "./useModelSlots";

describe("useModelSlots", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes all slots to Not assigned with 0 dirty slots", () => {
    const { result } = renderHook(() => useModelSlots());
    expect(result.current.dirtySlots.length).toBe(0);
    expect(result.current.appliedBindings.TEXT_SMALL).toEqual({
      slot: "TEXT_SMALL",
      providerId: null,
      modelId: null,
    });
  });

  it("marks slot dirty when binding changes and computes diff", () => {
    const { result } = renderHook(() => useModelSlots());

    act(() => {
      result.current.setBinding("TEXT_SMALL", "openai", "gpt-4.1-mini");
    });

    expect(result.current.dirtySlots).toContain("TEXT_SMALL");
    expect(result.current.diffs.length).toBe(1);
    expect(result.current.diffs[0].slotLabel).toBe("Small chat");
    expect(result.current.diffs[0].fromText).toBe("Not assigned");
    expect(result.current.diffs[0].toText).toBe("openai · gpt-4.1-mini");

    // Discard reverts back
    act(() => {
      result.current.discardAll();
    });

    expect(result.current.dirtySlots.length).toBe(0);
  });

  it("unassigns provider across all bound slots immediately", () => {
    const { result } = renderHook(() => useModelSlots());

    act(() => {
      result.current.setBinding("TEXT_SMALL", "provider-abc", "model-1");
      result.current.setBinding("TEXT_LARGE", "provider-abc", "model-2");
    });

    act(() => {
      result.current.unassignProvider("provider-abc");
    });

    expect(result.current.draftBindings.TEXT_SMALL.providerId).toBeNull();
    expect(result.current.draftBindings.TEXT_LARGE.providerId).toBeNull();
  });
});
