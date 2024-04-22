import { type Meta, type StoryObj } from "@storybook/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { useState } from "react";
import { Button } from "@codefast/ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Heading } from "@codefast/ui/heading";
import { Box } from "@codefast/ui/box";

const meta = {
  component: Collapsible,
  tags: ["autodocs"],
  title: "UIs/Collapsible",
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-2" {...args}>
        <Box className="flex items-center justify-between space-x-4 px-4">
          <Heading as="h4" className="text-sm font-semibold">
            @peduarte starred 3 repositories
          </Heading>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <CaretSortIcon className="size-4" />
              <Box as="span" className="sr-only">
                Toggle
              </Box>
            </Button>
          </CollapsibleTrigger>
        </Box>
        <Box className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">@radix-ui/primitives</Box>
        <CollapsibleContent className="space-y-2">
          <Box className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">@radix-ui/colors</Box>
          <Box className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">@stitches/react</Box>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};
