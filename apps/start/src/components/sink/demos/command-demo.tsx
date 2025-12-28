'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@codefast/ui/command';
import { CalculatorIcon, CalendarIcon, CreditCardIcon, SettingsIcon, SmileIcon, UserIcon } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';

export function CommandDemo() {
  const [open, setOpen] = useState(false);

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen((isOpen) => !isOpen);
    }
  });

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <p className="text-muted-foreground text-sm">
        Press{' '}
        <kbd className="bg-muted text-muted-foreground text-2.5 pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono font-medium opacity-100 select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
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
      </CommandDialog>
    </>
  );
}
