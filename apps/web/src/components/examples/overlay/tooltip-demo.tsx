import { Button } from "@codefast/ui/button";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import { InfoIcon, TerminalIcon } from "lucide-react";

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <div className="flex gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <TerminalIcon />
              CLI
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <InfoIcon />
              Info
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>More information</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
