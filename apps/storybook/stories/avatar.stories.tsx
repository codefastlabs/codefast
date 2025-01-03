import type { Meta, StoryObj } from '@storybook/react';

import { Avatar, AvatarFallback, AvatarImage } from '@codefast/ui';

const meta = {
  component: Avatar,
  tags: ['autodocs'],
  title: 'UI/Avatar',
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof Avatar>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="https://avatars.githubusercontent.com/u/13298232?v=4" />
      <AvatarFallback>VP</AvatarFallback>
    </Avatar>
  ),
};
