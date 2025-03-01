import type { Meta, StoryObj } from '@storybook/react';

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
  Kbd,
  Text,
} from '@codefast/ui';
import { CalculatorIcon, CalendarIcon, CreditCardIcon, SettingsIcon, SmileIcon, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const meta = {
  component: Command,
  tags: ['autodocs'],
  title: 'UI/Command',
} satisfies Meta<typeof Command>;

export default meta;

type Story = StoryObj<typeof Command>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Command {...args}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <CalendarIcon className="size-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem disabled>
            <SmileIcon className="size-4" />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <CalculatorIcon className="size-4" />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <UserIcon className="size-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCardIcon className="size-4" />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <SettingsIcon className="size-4" />
            <span>Settings</span>
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
      const down = (event: KeyboardEvent): void => {
        if (event.key === 'j' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          setOpen((prev) => !prev);
        }
      };

      document.addEventListener('keydown', down);

      return () => {
        document.removeEventListener('keydown', down);
      };
    }, []);

    return (
      <>
        <Text className="text-muted-foreground text-sm">
          Press{' '}
          <Kbd>
            <span>⌘</span>J
          </Kbd>
        </Text>

        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <CalendarIcon className="size-4" />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem>
                <SmileIcon className="size-4" />
                <span>Search Emoji</span>
              </CommandItem>
              <CommandItem>
                <CalculatorIcon className="size-4" />
                <span>Calculator</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <UserIcon className="size-4" />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCardIcon className="size-4" />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon className="size-4" />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};
