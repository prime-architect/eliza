import type { Meta, StoryObj } from "@storybook/react";
import { ModelSlotsTab } from "./ModelSlotsTab";

const meta: Meta<typeof ModelSlotsTab> = {
  title: "Settings/ModelSlotsTab",
  component: ModelSlotsTab,
};

export default meta;
type Story = StoryObj<typeof ModelSlotsTab>;

export const Default: Story = {
  render: () => (
    <div className="max-w-3xl p-6">
      <ModelSlotsTab
        providers={[
          {
            id: "openai",
            name: "OpenAI",
            type: "openai",
            enabled: true,
            status: "connected",
            serves: [
              "TEXT_SMALL",
              "TEXT_LARGE",
              "TEXT_MEDIUM",
              "TEXT_REASONING_SMALL",
              "TEXT_REASONING_LARGE",
              "TEXT_EMBEDDING",
              "TRANSCRIPTION",
              "TEXT_TO_SPEECH",
            ],
          },
        ]}
      />
    </div>
  ),
};
