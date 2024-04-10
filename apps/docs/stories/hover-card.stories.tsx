import type { Meta, StoryObj } from "@storybook/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@codefast/ui/hover-card";
import { Button } from "@codefast/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { CalendarDays } from "lucide-react";
import { Text } from "@codefast/ui/text";
import { Box } from "@codefast/ui/box";
import { Heading } from "@codefast/ui/heading";

const meta = {
  component: HoverCard,
  tags: ["autodocs"],
  title: "UIs/Hover Card",
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <Box className="pb-40">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof HoverCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <HoverCard {...args}>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <Box className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <Box className="space-y-1">
            <Heading as="h4" className="text-sm font-semibold">
              @nextjs
            </Heading>
            <Text className="text-sm">The React Framework – created and maintained by @vercel.</Text>
            <Box className="flex items-center pt-2">
              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
              <Box as="span" className="text-muted-foreground text-xs">
                Joined December 2021
              </Box>
            </Box>
          </Box>
        </Box>
      </HoverCardContent>
    </HoverCard>
  ),
};
