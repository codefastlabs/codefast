import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from '@codefast/ui/radio';
import { Box } from '@codefast/ui/box';
import { Label } from '@codefast/ui/label';

const meta = {
  component: Radio,
  tags: ['autodocs'],
  title: 'UIs/Radio',
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => (
    <Box className="flex flex-col gap-2">
      <Box asChild className="flex items-center gap-2">
        <Label>
          <Radio name="example" value="1" defaultChecked />
          Default
        </Label>
      </Box>
      <Box asChild className="flex items-center gap-2">
        <Label>
          <Radio name="example" value="2" />
          Comfortable
        </Label>
      </Box>
      <Box asChild className="flex items-center gap-2">
        <Label>
          <Radio name="example" value="3" />
          Compact
        </Label>
      </Box>
      <Box asChild className="flex items-center gap-2">
        <Label>
          <Radio name="example" value="4" disabled />
          Disabled
        </Label>
      </Box>
    </Box>
  ),
};
