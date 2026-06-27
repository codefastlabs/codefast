import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  FileIcon,
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

/**
 * Command — a COMPOSITE command palette built on `cmdk`. The `Command` root is a
 * normal component whose own props (`loop`, `shouldFilter`) drive fuzzy filtering
 * and keyboard navigation; the palette content is composed from the sub-parts.
 * Content here is authored for Storybook, NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { loop: false, shouldFilter: true },
  argTypes: {
    asChild: { table: { disable: true } },
    defaultValue: { table: { disable: true } },
    filter: { table: { disable: true } },
    loop: { control: "boolean" },
    onValueChange: { table: { disable: true } },
    shouldFilter: { control: "boolean" },
    value: { table: { disable: true } },
  },
  component: Command,
  parameters: {
    controls: { include: ["loop", "shouldFilter"] },
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
  subcomponents: {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandLoading,
    CommandSeparator,
    CommandShortcut,
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

/** Disabling `shouldFilter` keeps every item visible regardless of the query. */
export const Unfiltered = meta.story({
  args: { shouldFilter: false },
  render: Default.input.render,
});

export const FiltersOnType = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
FiltersOnType.test("removes non-matching items as you type", async ({ canvas, userEvent }) => {
  const input = canvas.getByPlaceholderText(/type a command or search/i);

  // Sanity: a non-matching item is present before filtering.
  await expect(canvas.getByText("Profile")).toBeInTheDocument();

  await userEvent.type(input, "Calendar");

  // The matching item survives; cmdk removes non-matching items from the DOM.
  await expect(await canvas.findByText("Calendar")).toBeVisible();
  await expect(canvas.queryByText("Profile")).not.toBeInTheDocument();
  await expect(canvas.queryByText("Billing")).not.toBeInTheDocument();
});
