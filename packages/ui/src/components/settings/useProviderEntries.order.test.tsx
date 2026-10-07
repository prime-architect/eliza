/** Verifies useProviderEntries provider ordering through the package's configured test harness. */
// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProviderEntries } from "./useProviderEntries";

const platform = vi.hoisted(() => ({ value: "web" as string }));
vi.mock("../../platform/platform-guards", () => ({
  getFrontendPlatform: () => platform.value,
}));

function run() {
  const { result } = renderHook(() =>
    useProviderEntries({
      allAiProviders: [],
      elizaCloudConnected: false,
      cloudCallsDisabled: false,
      isCloudSelected: false,
      isCloudConfigured: false,
      resolvedSelectedId: null,
      subscriptionStatus: [],
      anthropicCliDetected: false,
      t: (key: string, vars?: Record<string, unknown>) =>
        (vars?.defaultValue as string) ?? key,
    }),
  );
  return result.current.providerEntries.map((e) => e.id);
}

describe("useProviderEntries provider ordering", () => {
  afterEach(() => {
    platform.value = "web";
  });

  it("on mobile surfaces the local provider first (before subscriptions)", () => {
    platform.value = "ios";
    const ids = run();
    expect(ids[0]).toBe("__local__");
    const firstSub = ids.findIndex((id) => id !== "__local__");
    expect(ids.indexOf("__local__")).toBeLessThan(firstSub);
  });

  it("on desktop/web keeps the local provider after the subscription providers", () => {
    platform.value = "web";
    const ids = run();
    expect(ids[0]).not.toBe("__local__");
    expect(ids.indexOf("__local__")).toBeGreaterThan(0);
  });
});
