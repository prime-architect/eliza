import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../ui/button";
import { AddProviderWizard } from "./AddProviderWizard";

const meta: Meta<typeof AddProviderWizard> = {
  title: "Settings/AddProviderWizard",
  component: AddProviderWizard,
};

export default meta;
type Story = StoryObj<typeof AddProviderWizard>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>Open Wizard</Button>
        <AddProviderWizard
          open={open}
          onOpenChange={setOpen}
          onSave={async (record) => {
            console.log("Saved provider record:", record);
          }}
        />
      </div>
    );
  },
};
