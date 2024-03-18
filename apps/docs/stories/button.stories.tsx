import { Button } from "@codefast/ui/button";
import { type Meta, type StoryObj } from "@storybook/react";

const meta = {
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      description: "The variant of the button.",
      options: [
        "default",
        "secondary",
        "outline",
        "destructive",
        "ghost",
        "link",
      ],
    },
    size: {
      control: { type: "inline-radio" },
      description: "The size of the button.",
      options: ["sm", "default", "lg"],
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
  args: {
    variant: "default",
    size: "default",
    disabled: false,
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

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link Button",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};
