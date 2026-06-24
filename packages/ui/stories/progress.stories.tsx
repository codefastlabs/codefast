import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress } from "#/components/progress";

const meta = {
  args: { value: 68 },
  component: Progress,
  render: (args) => (
    <div className="w-full max-w-xs">
      <Progress {...args} />
    </div>
  ),
  title: "Feedback/Progress",
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
        <span>Uploading…</span>
        <span>68%</span>
      </div>
      <Progress value={68} />
    </div>
  ),
};

export const Complete: Story = {
  args: { value: 100 },
};

export const Empty: Story = {
  args: { value: 0 },
};
