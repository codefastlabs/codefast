import type { Meta, StoryObj } from '@storybook/react';

import { Button, Spinner, Switch } from '@codefast/ui';
import { BookmarkIcon } from '@radix-ui/react-icons';

const meta = {
  component: Spinner,
  tags: ['autodocs'],
  title: 'UI/Spinner',
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof Spinner>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {};

/* -----------------------------------------------------------------------------
 * Story: Size
 * -------------------------------------------------------------------------- */

export const Size: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Children
 * -------------------------------------------------------------------------- */

export const WithChildren: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner loading>
        <Switch defaultChecked />
      </Spinner>

      <Spinner loading={false}>
        <Switch defaultChecked />
      </Spinner>
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Button
 * -------------------------------------------------------------------------- */

export const WithButton: Story = {
  render: () => (
    <Button loading prefix={<BookmarkIcon />}>
      Bookmark
    </Button>
  ),
};
