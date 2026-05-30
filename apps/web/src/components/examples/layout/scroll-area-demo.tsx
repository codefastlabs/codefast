import { cn } from "@codefast/tailwind-variants";
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
    <ScrollArea className={cn("h-36 w-48 p-3", "rounded-xl border border-border")}>
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
