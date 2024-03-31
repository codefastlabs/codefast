import type { Meta, StoryObj } from "@storybook/react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@codefast/ui/command";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Box } from "@codefast/ui/box";
import { Text } from "@codefast/ui/text";
import { Kbd } from "@codefast/ui/kbd";

const meta = {
  component: Command,
  tags: ["autodocs"],
  title: "UIs/Command",
} satisfies Meta<typeof Command>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Command className="rounded-lg border shadow-md" {...args}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar className="mr-2 size-4" />
            <Box as="span">Calendar</Box>
          </CommandItem>
          <CommandItem>
            <Smile className="mr-2 size-4" />
            <Box as="span">Search Emoji</Box>
          </CommandItem>
          <CommandItem>
            <Calculator className="mr-2 size-4" />
            <Box as="span">Calculator</Box>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User className="mr-2 size-4" />
            <Box as="span">Profile</Box>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard className="mr-2 size-4" />
            <Box as="span">Billing</Box>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 size-4" />
            <Box as="span">Settings</Box>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Dialog
 * -------------------------------------------------------------------------- */

export const WithDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
      const down = (e: KeyboardEvent): void => {
        if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen((prev) => !prev);
        }
      };

      document.addEventListener("keydown", down);

      return () => {
        document.removeEventListener("keydown", down);
      };
    }, []);

    return (
      <>
        <Text className="text-muted-foreground text-sm">
          Press{" "}
          <Kbd>
            <Box as="span">⌘</Box>J
          </Kbd>
        </Text>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <Calendar className="mr-2 h-4 w-4" />
                <Box as="span">Calendar</Box>
              </CommandItem>
              <CommandItem>
                <Smile className="mr-2 h-4 w-4" />
                <Box as="span">Search Emoji</Box>
              </CommandItem>
              <CommandItem>
                <Calculator className="mr-2 h-4 w-4" />
                <Box as="span">Calculator</Box>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <User className="mr-2 h-4 w-4" />
                <Box as="span">Profile</Box>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <Box as="span">Billing</Box>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Settings className="mr-2 h-4 w-4" />
                <Box as="span">Settings</Box>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};
