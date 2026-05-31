import { ScrollArea } from "@codefast/ui/scroll-area";

const ITEMS = [
  "Accordion",
  "Alert",
  "Avatar",
  "Badge",
  "Button",
  "Calendar",
  "Card",
  "Carousel",
  "Checkbox",
  "Command",
  "Dialog",
  "Drawer",
];

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-36 w-48 rounded-xl border border-border p-3">
      <div className="space-y-1.5">
        {ITEMS.map((item) => (
          <p key={item} className="text-xs text-muted-foreground">
            {item}
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}
