import type { Meta, StoryObj } from "@storybook/react";
import { LocalProviderDetail } from "./LocalProviderDetail";

const meta: Meta<typeof LocalProviderDetail> = {
  title: "Settings/LocalProviderDetail",
  component: LocalProviderDetail,
};

export default meta;
type Story = StoryObj<typeof LocalProviderDetail>;

export const Default: Story = {
  render: () => (
    <div className="max-w-4xl p-6">
      <LocalProviderDetail
        onBack={() => console.log("Back clicked")}
        onAssignSlots={(bundle) => console.log("Assigned bundle:", bundle)}
      />
    </div>
  ),
};
