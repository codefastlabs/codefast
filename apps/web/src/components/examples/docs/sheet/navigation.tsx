import { Button } from "@codefast/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@codefast/ui/sheet";
import { HomeIcon, InboxIcon, MenuIcon, SettingsIcon } from "lucide-react";

const NAV = [
  { label: "Home", icon: HomeIcon },
  { label: "Inbox", icon: InboxIcon },
  { label: "Settings", icon: SettingsIcon },
];

export function SheetNavigation() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-2 grid gap-1 px-2">
          {NAV.map(({ label, icon: Icon }) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ui-fg hover:bg-ui-surface"
            >
              <Icon className="size-4 text-ui-muted" />
              {label}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
