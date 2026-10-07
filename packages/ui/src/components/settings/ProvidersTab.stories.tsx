import type { Meta, StoryObj } from "@storybook/react";
import { ProvidersTab } from "./ProvidersTab";

const meta: Meta<typeof ProvidersTab> = {
  title: "Settings/ProvidersTab",
  component: ProvidersTab,
};

export default meta;
type Story = StoryObj<typeof ProvidersTab>;

export const DefaultEmpty: Story = {
  render: () => (
    <div className="max-w-3xl p-6">
      <ProvidersTab />
    </div>
  ),
};
