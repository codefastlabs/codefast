import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@codefast/ui/command";
import { CalendarIcon, FileIcon, SearchIcon, SettingsIcon, UserIcon } from "lucide-react";

export function CommandPalette() {
  const [ran, setRan] = useState<string | null>(null);

  function run(label: string): void {
    setRan(label);
  }

  return (
    <div className="w-full max-w-xs space-y-3">
      <Command className="rounded-xl border shadow-md">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => run("Calendar")}>
              <CalendarIcon />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem onSelect={() => run("Search")}>
              <SearchIcon />
              <span>Search the docs</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => run("Profile")}>
              <UserIcon />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run("Files")}>
              <FileIcon />
              <span>Files</span>
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run("Settings")}>
              <SettingsIcon />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <p className="text-center text-xs text-ui-muted">
        {ran ? (
          <>
            Ran command: <span className="font-medium text-ui-fg">{ran}</span>
          </>
        ) : (
          "Filter, then press Enter to run a command"
        )}
      </p>
    </div>
  );
}
