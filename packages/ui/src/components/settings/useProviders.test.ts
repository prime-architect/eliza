// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProviders } from "./useProviders";

describe("useProviders", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts empty by default with local engine detected", () => {
    const { result } = renderHook(() => useProviders());
    expect(result.current.providers).toEqual([]);
    expect(result.current.localEngine.available).toBe(true);
    expect(result.current.localEngine.downloadedCount).toBe(0);
  });

  it("adds a provider record with generated ID and persists", async () => {
    const { result } = renderHook(() => useProviders());
    let addedId = "";
    await act(async () => {
      const p = await result.current.addProvider({
        name: "Anthropic Direct",
        type: "anthropic",
        enabled: true,
        status: "connected",
        serves: ["TEXT_SMALL", "TEXT_LARGE"],
      });
      addedId = p.id;
    });

    expect(result.current.providers.length).toBe(1);
    expect(result.current.providers[0].name).toBe("Anthropic Direct");
    expect(result.current.providers[0].id).toBe(addedId);
    expect(result.current.providers[0].status).toBe("connected");
  });

  it("toggles and removes a provider with removal notification", async () => {
    const onRemoved = vi.fn();
    const { result } = renderHook(() => useProviders(onRemoved));
    let id = "";

    await act(async () => {
      const p = await result.current.addProvider({
        name: "Test Provider",
        type: "openai",
        enabled: true,
        status: "connected",
        serves: ["TEXT_SMALL"],
      });
      id = p.id;
    });

    expect(result.current.providers[0].enabled).toBe(true);

    await act(async () => {
      await result.current.toggleProvider(id, false);
    });
    expect(result.current.providers[0].enabled).toBe(false);

    await act(async () => {
      await result.current.removeProvider(id);
    });
    expect(result.current.providers.length).toBe(0);
    expect(onRemoved).toHaveBeenCalledWith(id);
  });
});
