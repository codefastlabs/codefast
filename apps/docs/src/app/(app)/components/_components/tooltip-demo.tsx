import { ChevronUpIcon, CircleIcon, InfoIcon } from "lucide-react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Button, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui";

const SIDES = ["top", "right", "bottom", "left"] as const;

export function TooltipDemo(): JSX.Element {
  return (
    <TooltipProvider delayDuration={0}>
      <GridWrapper className="*:grid *:place-content-center">
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-1">
            {SIDES.map((side) => (
              <div
                key={side}
                className={cn(
                  "flex items-center justify-center",
                  side === "top" && "col-start-2",
                  side === "right" && "col-start-3 row-start-2",
                  side === "bottom" && "col-start-2 row-start-3",
                  side === "left" && "row-start-2",
                )}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="capitalize" size="icon" variant="outline">
                      {side === "top" && <ChevronUpIcon />}
                      {side === "right" && <ChevronUpIcon className="rotate-90" />}
                      {side === "bottom" && <ChevronUpIcon className="rotate-180" />}
                      {side === "left" && <ChevronUpIcon className="rotate-270" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={side}>
                    <p>Add to library</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
            <div className="col-start-2 row-start-2 flex items-center justify-center">
              <CircleIcon className="text-muted-foreground/50 size-4" />
            </div>
          </div>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost">
                <InfoIcon />
                <span className="sr-only">Info</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              To learn more about how this works, check out the docs. If you have any questions,
              please reach out to us.
            </TooltipContent>
          </Tooltip>
        </div>
      </GridWrapper>
    </TooltipProvider>
  );
}
