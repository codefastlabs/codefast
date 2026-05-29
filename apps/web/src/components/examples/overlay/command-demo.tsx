import { useEffect, useRef, useState } from "react";
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

export function CommandDemo() {
  const [isVisible, setIsVisible] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;

    if (!host || isVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(host);

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div
        ref={hostRef}
        className="h-56 w-full max-w-xs rounded-xl border border-dashed border-border/70 bg-muted/40"
      />
    );
  }

  return (
    <div ref={hostRef}>
      <Command className="w-full max-w-xs rounded-xl border shadow-md">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList className="h-40 overflow-auto">
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
    </div>
  );
}
