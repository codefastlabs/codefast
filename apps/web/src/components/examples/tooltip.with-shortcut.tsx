import { Button } from "@codefast/ui/button";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import { TerminalIcon } from "lucide-react";

export function TooltipWithShortcut() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">
            <TerminalIcon />
            Terminal
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open terminal</p>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>`</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
