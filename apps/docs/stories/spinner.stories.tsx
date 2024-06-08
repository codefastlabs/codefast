import { Button } from '@codefast/ui/button';
import { Switch } from '@codefast/ui/switch';
import { BookmarkIcon } from '@radix-ui/react-icons';
import { Spinner } from '@codefast/ui/spinner';
import { Box } from '@codefast/ui/box';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  component: Spinner,
  tags: ['autodocs'],
  title: 'UIs/Spinner',
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {};

/* -----------------------------------------------------------------------------
 * Story: Size
 * -------------------------------------------------------------------------- */

export const Size: Story = {
  render: () => (
    <Box className="flex items-center gap-4">
      <Spinner />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </Box>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Children
 * -------------------------------------------------------------------------- */

export const WithChildren: Story = {
  render: () => (
    <Box className="flex items-center gap-4">
      <Spinner loading>
        <Switch defaultChecked />
      </Spinner>

      <Spinner loading={false}>
        <Switch defaultChecked />
      </Spinner>
    </Box>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Button
 * -------------------------------------------------------------------------- */

export const WithButton: Story = {
  render: () => (
    <Button disabled>
      <Spinner loading>
        <BookmarkIcon />
      </Spinner>
      Bookmark
    </Button>
  ),
};
