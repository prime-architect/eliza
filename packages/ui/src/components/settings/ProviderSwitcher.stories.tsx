import type { Meta, StoryObj } from "@storybook/react";
import { ProviderSwitcher } from "./ProviderSwitcher";

const meta: Meta<typeof ProviderSwitcher> = {
  title: "Settings/ProviderSwitcher",
  component: ProviderSwitcher,
};

export default meta;
type Story = StoryObj<typeof ProviderSwitcher>;

export const DefaultProviders: Story = {
  render: () => (
    <div className="max-w-4xl p-6">
      <ProviderSwitcher initialTab="providers" />
    </div>
  ),
};

export const ModelsTab: Story = {
  render: () => (
    <div className="max-w-4xl p-6">
      <ProviderSwitcher initialTab="models" />
    </div>
  ),
};
