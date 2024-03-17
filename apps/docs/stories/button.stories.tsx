import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@codefast/ui/button";

const meta = {
  argTypes: {
    variant: {
      options: [
        "default",
        "secondary",
        "outline",
        "destructive",
        "ghost",
        "link",
      ],
      control: { type: "inline-radio" },
    },
    size: {
      options: ["sm", "default", "lg"],
      control: { type: "inline-radio" },
    },
  },
  args: {
    variant: "default",
    size: "default",
  },
  component: Button,
  tags: ["autodocs"],
  title: "UIs/Button",
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Click me",
  },
};
