import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  FileIcon,
  SearchIcon,
  SettingsIcon,
  SmileIcon,
  UserIcon,
} from "lucide-react";
import { expect } from "storybook/test";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
} from "#/components/command";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { loop: false, shouldFilter: true },
  argTypes: {
    asChild: { table: { disable: true } },
    defaultValue: { table: { disable: true } },
    filter: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    value: { table: { disable: true } },
  },
  component: Command,
  subcomponents: {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
    CommandShortcut,
    CommandLoading,
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A fast, composable command palette with fuzzy filtering built on `cmdk`.",
          "",
          "**Anatomy:** `Command > CommandInput + CommandList > (CommandEmpty | CommandGroup > CommandItem | CommandSeparator | CommandLoading)`.",
          "Wrap in `CommandDialog` for a modal palette; `CommandShortcut` renders trailing key hints inside an item.",
        ].join("\n"),
      },
    },
  },
  title: "Overlay/Command",
});

export const Default = meta.story({
  render: (args) => (
    <Command {...args} className="w-full max-w-xs rounded-xl border shadow-md">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <CalendarIcon />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <SearchIcon />
            <span>Search</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <UserIcon />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <FileIcon />
            <span>Files</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <SettingsIcon />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
});

export const WithGroups = meta.story({
  render: () => (
    <Command className="w-full max-w-xs rounded-xl border shadow-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <CalendarIcon />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <SmileIcon />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <CalculatorIcon />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <UserIcon />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCardIcon />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <SettingsIcon />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
});

export const FiltersOnType = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
FiltersOnType.test("filters on type", async ({ canvas, userEvent }) => {
  const input = canvas.getByPlaceholderText(/type a command or search/i);

  await userEvent.type(input, "Calendar");
  await expect(await canvas.findByText("Calendar")).toBeVisible();
  // Non-matching items are removed from the DOM by cmdk's filtering.
  await expect(canvas.queryByText("Profile")).not.toBeInTheDocument();
  await expect(canvas.queryByText("Search")).not.toBeInTheDocument();
});
