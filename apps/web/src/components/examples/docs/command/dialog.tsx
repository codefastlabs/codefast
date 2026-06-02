import { useState } from "react";
import { Button } from "@codefast/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@codefast/ui/command";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { CompassIcon, LayoutGridIcon, SettingsIcon } from "lucide-react";

const PAGES = [
  { label: "Home", icon: CompassIcon },
  { label: "Components", icon: LayoutGridIcon },
  { label: "Settings", icon: SettingsIcon },
];

export function CommandDialogExample() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<string | null>(null);

  return (
    <div className="space-y-3 text-center">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open command palette
        <KbdGroup className="ml-2">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <p className="text-xs text-ui-muted">
        {page ? (
          <>
            Navigated to <span className="font-medium text-ui-fg">{page}</span>
          </>
        ) : (
          "Open the palette and pick a page"
        )}
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map(({ label, icon: Icon }) => (
              <CommandItem
                key={label}
                onSelect={() => {
                  setPage(label);
                  setOpen(false);
                }}
              >
                <Icon />
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
