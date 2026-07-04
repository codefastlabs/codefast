import { Bubble, BubbleContent, BubbleReactions } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@codefast/ui/tooltip";
import { CheckIcon } from "lucide-react";

export function BubbleTooltip() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Bubble variant="secondary">
        <BubbleContent>Did you remove the stale route?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Yes, removed it from the registry.</BubbleContent>
        <BubbleReactions className="p-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-xs" variant="ghost">
                <CheckIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Read on Jan 5, 2026 at 4:32 PM</TooltipContent>
          </Tooltip>
        </BubbleReactions>
      </Bubble>
    </div>
  );
}
