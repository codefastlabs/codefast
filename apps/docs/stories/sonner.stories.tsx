import { toast, Toaster } from '@codefast/ui/sonner';
import { Button } from '@codefast/ui/button';
import { Box } from '@codefast/ui/box';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  component: Toaster,
  tags: ['autodocs'],
  title: 'UIs/Sonner',
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => (
    <Box className="h-96">
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
    </Box>
  ),
};
