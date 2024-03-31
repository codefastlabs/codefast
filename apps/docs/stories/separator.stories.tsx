import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "@codefast/ui/separator";
import { Box } from "@codefast/ui/box";
import { Text } from "@codefast/ui/text";
import { Heading } from "@codefast/ui/heading";

const meta = {
  component: Separator,
  tags: ["autodocs"],
  title: "UIs/Separator",
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => (
    <Box>
      <Box className="space-y-1">
        <Heading as="h4" className="text-sm font-medium leading-none">
          Radix Primitives
        </Heading>
        <Text className="text-muted-foreground text-sm">
          An open-source UI component library.
        </Text>
      </Box>
      <Separator className="my-4" />
      <Box className="flex h-5 items-center space-x-4 text-sm">
        <Box>Blog</Box>
        <Separator orientation="vertical" />
        <Box>Docs</Box>
        <Separator orientation="vertical" />
        <Box>Source</Box>
      </Box>
    </Box>
  ),
};
