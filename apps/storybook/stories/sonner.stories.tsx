import { Button, toast, Toaster } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';
import { consola } from 'consola';

const meta = {
  component: Toaster,
  tags: ['autodocs'],
  title: 'UI/Sonner',
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
            action: {
              label: 'Undo',
              onClick: () => {
                consola.log('Undo');
              },
            },
            description: 'Sunday, December 03, 2023 at 9:00 AM',
          })
        }
      >
        Show Toast
      </Button>
      <Toaster />
    </div>
  ),
};
