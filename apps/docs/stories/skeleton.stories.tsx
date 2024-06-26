import { Skeleton } from '@codefast/ui/skeleton';
import { Box } from '@codefast/ui/box';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Skeleton,
  tags: ['autodocs'],
  title: 'UIs/Skeleton',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => (
    <Box className="flex items-center space-x-4">
      <Skeleton className="size-12" />
      <Box className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </Box>
    </Box>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Card
 * -------------------------------------------------------------------------- */

export const Card: Story = {
  render: () => (
    <Box className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px]" />
      <Box className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </Box>
    </Box>
  ),
};
