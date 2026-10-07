import type { Meta, StoryObj } from "@storybook/react";
import { ApplyAllBar } from "./ApplyAllBar";

const meta: Meta<typeof ApplyAllBar> = {
  title: "Settings/ApplyAllBar",
  component: ApplyAllBar,
};

export default meta;
type Story = StoryObj<typeof ApplyAllBar>;

export const WithDiffs: Story = {
  args: {
    diffs: [
      {
        slot: "TEXT_SMALL",
        slotLabel: "Small chat",
        fromText: "Not assigned",
        toText: "OpenAI · gpt-4.1-mini",
      },
      {
        slot: "TEXT_LARGE",
        slotLabel: "Large chat",
        fromText: "Not assigned",
        toText: "Anthropic · claude-3-7-sonnet",
      },
    ],
    savePhase: "idle",
    saveErrorMessage: null,
    onApply: async () => {},
    onDiscard: () => {},
  },
};
