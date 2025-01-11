import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from '@codefast/ui';

const meta = {
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Skeleton',
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof Skeleton>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="size-12" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[15.625rem]" />
        <Skeleton className="h-4 w-[12.5rem]" />
      </div>
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Card
 * -------------------------------------------------------------------------- */

export const Card: Story = {
  render: () => (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[7.8125rem] w-[15.625rem]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[15.625rem]" />
        <Skeleton className="h-4 w-[12.5rem]" />
      </div>
    </div>
  ),
};
