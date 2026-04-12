import { cn } from "@codefast/tailwind-variants";
import { Button } from "@codefast/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";

export function CollapsibleDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("flex w-full flex-col gap-2", "md:w-87.5")}
    >
      <div className={cn("flex items-center justify-between gap-4", "px-4")}>
        <h4 className="line-clamp-1 text-sm font-semibold">@peduarte starred 3 repositories</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronsUpDownIcon className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className={cn("px-4 py-2", "rounded-lg border shadow-xs", "font-mono text-sm")}>
        @radix-ui/primitives
      </div>
      <CollapsibleContent className="flex flex-col gap-2">
        <div className={cn("px-4 py-2", "rounded-lg border shadow-xs", "font-mono text-sm")}>
          @radix-ui/colors
        </div>
        <div className={cn("px-4 py-2", "rounded-lg border shadow-xs", "font-mono text-sm")}>
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
