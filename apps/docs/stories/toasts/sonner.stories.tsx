import { Button, toast, Toaster } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Toaster,
  tags: ['autodocs'],
  title: 'Components/Toasts/Sonner',
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof Toaster>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => (
    <div className="h-96">
      <Button
        variant="outline"
        onClick={() =>
          toast.message('Event has been created', {
            description: 'Sunday, December 03, 2023 at 9:00 AM',
            action: {
              label: 'Undo',
              onClick: () => {
                // eslint-disable-next-line no-console -- This is a console log
                console.log('Undo');
              },
            },
          })
        }
      >
        Show Toast
      </Button>
      <Toaster />
    </div>
  ),
};
