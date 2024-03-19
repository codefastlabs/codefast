import { type Meta, type StoryObj } from "@storybook/react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@codefast/ui/card";

const meta = {
  component: Card,
  tags: ["autodocs"],
  title: "UIs/Card",
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
    </Card>
  ),
};
