import { Alert, AlertDescription, AlertTitle } from '@codefast/ui';
import { ExclamationTriangleIcon, RocketIcon } from '@radix-ui/react-icons';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  args: {
    variant: 'default',
  },
  component: Alert,
  tags: ['autodocs'],
  title: 'Components/Feedback/Alert',
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
 * Story: Destructive
 * -------------------------------------------------------------------------- */

export const Destructive: Story = {
  render: (args) => (
    <Alert variant="destructive" {...args}>
      <ExclamationTriangleIcon className="size-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
};
