import { Button } from "@codefast/ui/button";
import { Kbd } from "@codefast/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import { SaveIcon } from "lucide-react";

export function TooltipKeyboard() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon-sm">
            <SaveIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Save Changes <Kbd>S</Kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
