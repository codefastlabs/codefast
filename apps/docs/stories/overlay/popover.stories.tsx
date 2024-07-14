import { Popover, PopoverContent, PopoverTrigger } from '@codefast/ui/popover';
import { Button } from '@codefast/ui/button';
import { Label } from '@codefast/ui/label';
import { Text } from '@codefast/ui/text';
import { Box } from '@codefast/ui/box';
import { Heading } from '@codefast/ui/heading';
import { type Meta, type StoryObj } from '@storybook/react';
import { TextInput } from '@codefast/ui/text-input';

const meta = {
  component: Popover,
  tags: ['autodocs'],
  title: 'Components/Overlay/Popover',
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Box className="grid gap-4">
          <Box className="space-y-2">
            <Heading as="h4" className="font-medium leading-none">
              Dimensions
            </Heading>
            <Text className="text-muted-foreground text-sm">Set the dimensions for the layer.</Text>
          </Box>
          <Box className="grid gap-3">
            <Box className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <TextInput className="col-span-2" defaultValue="100%" id="width" />
            </Box>
            <Box className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max width</Label>
              <TextInput className="col-span-2" defaultValue="300px" id="maxWidth" />
            </Box>
            <Box className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <TextInput className="col-span-2" defaultValue="25px" id="height" />
            </Box>
            <Box className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <TextInput className="col-span-2" defaultValue="none" id="maxHeight" />
            </Box>
          </Box>
        </Box>
      </PopoverContent>
    </Popover>
  ),
};
