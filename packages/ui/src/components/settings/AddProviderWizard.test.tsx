// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddProviderWizard } from "./AddProviderWizard";

const appState = vi.hoisted(() => ({
  t: (key: string, vars?: Record<string, unknown>) =>
    String(vars?.defaultValue ?? key),
}));

vi.mock("../../state/app-store", () => ({
  useAppSelector: (selector: (state: typeof appState) => unknown) =>
    selector(appState),
}));

describe("AddProviderWizard", () => {
  afterEach(cleanup);

  it("renders when open and enforces test connection before save is enabled", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <AddProviderWizard
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />,
    );

    expect(screen.getByText("Add Provider")).toBeTruthy();
    const saveBtn = screen.getByRole("button", {
      name: /save/i,
    }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);

    // Enter api key
    const apiKeyInput = screen.getByLabelText(/API key/i);
    fireEvent.change(apiKeyInput, { target: { value: "sk-test-key-12345" } });

    // Click test connection
    const testBtn = screen.getByRole("button", { name: "Test connection" });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/Connection verified!/i)).toBeTruthy();
    });

    expect(saveBtn.disabled).toBe(false);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "OpenAI",
          type: "openai",
          enabled: true,
          status: "connected",
        }),
      );
    });
  });

  it("surfaces connection errors inline and keeps save disabled", async () => {
    const testHandler = vi.fn().mockResolvedValue({
      ok: false,
      error: "Authentication failed. 401 Unauthorized.",
    });

    render(
      <AddProviderWizard
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        testConnectionHandler={testHandler}
      />,
    );

    const testBtn = screen.getByRole("button", { name: "Test connection" });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText("Connection failed")).toBeTruthy();
      expect(
        screen.getByText("Authentication failed. 401 Unauthorized."),
      ).toBeTruthy();
    });

    const saveBtn = screen.getByRole("button", {
      name: /save/i,
    }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });
});
