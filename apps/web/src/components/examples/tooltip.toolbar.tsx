import { Button } from "@codefast/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

const TOOLS = [
  { label: "Bold", icon: BoldIcon },
  { label: "Italic", icon: ItalicIcon },
  { label: "Underline", icon: UnderlineIcon },
];

export function TooltipToolbar() {
  return (
    <TooltipProvider>
      <div className="flex gap-1 rounded-lg border border-ui-border p-1">
        {TOOLS.map(({ label, icon: Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={label}>
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
