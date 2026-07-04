import { Bubble, BubbleContent, BubbleReactions } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@codefast/ui/popover";
import { InfoIcon } from "lucide-react";

export function BubblePopover() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Bubble align="end">
        <BubbleContent>Run the build script.</BubbleContent>
      </Bubble>
      <Bubble variant="destructive">
        <BubbleContent>Failed to run the command.</BubbleContent>
        <BubbleReactions>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Show error details"
                className="aria-expanded:text-destructive"
                size="icon-xs"
                variant="ghost"
              >
                <InfoIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle className="text-sm">Command failed with exit code 1</PopoverTitle>
                <PopoverDescription className="text-sm">
                  ENOENT: no such file or directory, open pnpm-lock.yaml
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </BubbleReactions>
      </Bubble>
    </div>
  );
}
