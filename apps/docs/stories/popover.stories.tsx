import type { Meta, StoryObj } from "@storybook/react";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { Button } from "@codefast/ui/button";
import { Label } from "@codefast/ui/label";
import { Input } from "@codefast/ui/input";
import { Text } from "@codefast/ui/text";
import { Box } from "@codefast/ui/box";
import { Heading } from "@codefast/ui/heading";

const meta = {
  component: Popover,
  tags: ["autodocs"],
  title: "UIs/Popover",
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
              <Input id="width" defaultValue="100%" className="col-span-2" />
            </Box>
            <Box className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max width</Label>
              <Input id="maxWidth" defaultValue="300px" className="col-span-2" />
            </Box>
            <Box className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input id="height" defaultValue="25px" className="col-span-2" />
            </Box>
            <Box className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input id="maxHeight" defaultValue="none" className="col-span-2" />
            </Box>
          </Box>
        </Box>
      </PopoverContent>
    </Popover>
  ),
};
