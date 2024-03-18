import { Alert, AlertTitle, AlertDescription } from "@codefast/ui/alert";
import { type Meta, type StoryObj } from "@storybook/react";
import { ExclamationTriangleIcon, RocketIcon } from "@radix-ui/react-icons";

const meta = {
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      description: "The variant of the alert.",
      options: ["default", "destructive"],
    },
  },
  args: {
    variant: "default",
  },
  component: Alert,
  tags: ["autodocs"],
  title: "UIs/Alert",
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <RocketIcon className="size-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
  render: (args) => (
    <Alert {...args}>
      <ExclamationTriangleIcon className="size-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
};
