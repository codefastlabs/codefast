import { type Meta, type StoryObj } from "@storybook/react";
import { Badge } from "@codefast/ui/badge";

const meta = {
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      description: "The variant of the badge.",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
  args: {
    variant: "default",
  },
  component: Badge,
  tags: ["autodocs"],
  title: "UIs/Badge",
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Badge",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive Badge",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Badge",
  },
};
