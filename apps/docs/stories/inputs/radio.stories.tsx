import { Radio } from '@codefast/ui/radio';
import { Box } from '@codefast/ui/box';
import { Label } from '@codefast/ui/label';
import { useId } from 'react';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Radio,
  tags: ['autodocs'],
  title: 'Components/Inputs/Radio',
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => {
    const id = useId();

    return (
      <Box className="flex flex-col gap-2">
        <Box className="flex items-center gap-2">
          <Radio defaultChecked id={`${id}-1`} name="example" value="1" />
          <Label htmlFor={`${id}-1`}>Default</Label>
        </Box>
        <Box className="flex items-center gap-2">
          <Radio id={`${id}-2`} name="example" value="2" />
          <Label htmlFor={`${id}-2`}>Comfortable</Label>
        </Box>
        <Box className="flex items-center gap-2">
          <Radio id={`${id}-3`} name="example" value="3" />
          <Label htmlFor={`${id}-3`}>Compact</Label>
        </Box>
        <Box className="flex items-center gap-2">
          <Radio disabled id={`${id}-4`} name="example" value="4" />
          <Label htmlFor={`${id}-4`}>Disabled</Label>
        </Box>
      </Box>
    );
  },
};