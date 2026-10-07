import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ModelSlotRow } from "./ModelSlotRow";
import type { SlotBinding } from "./useModelSlots";

const meta: Meta<typeof ModelSlotRow> = {
  title: "Settings/ModelSlotRow",
  component: ModelSlotRow,
};

export default meta;
type Story = StoryObj<typeof ModelSlotRow>;

export const Default: Story = {
  render: () => {
    const [binding, setBinding] = useState<SlotBinding>({
      slot: "TEXT_SMALL",
      providerId: null,
      modelId: null,
    });

    return (
      <div className="max-w-xl p-4">
        <ModelSlotRow
          slot="TEXT_SMALL"
          label="Small chat"
          description="Short completions and classifications."
          binding={binding}
          availableProviders={[
            {
              id: "openai",
              name: "OpenAI",
              type: "openai",
              enabled: true,
              status: "connected",
              serves: ["TEXT_SMALL", "TEXT_LARGE"],
            },
          ]}
          onBindingChange={setBinding}
        />
      </div>
    );
  },
};
