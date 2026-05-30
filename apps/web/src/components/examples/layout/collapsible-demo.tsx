import { cn } from "@codefast/tailwind-variants";
import { useState } from "react";

import { Button } from "@codefast/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { ChevronsUpDownIcon } from "lucide-react";

export function CollapsibleDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible className="w-full max-w-xs space-y-2" open={open} onOpenChange={setOpen}>
      <div
        className={cn("flex items-center justify-between gap-2", "px-4 py-2", "rounded-lg border")}
      >
        <span className="text-sm font-medium">Starred repositories</span>
        <CollapsibleTrigger asChild>
          <Button size="icon" variant="ghost">
            <ChevronsUpDownIcon />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className={cn("px-4 py-2", "rounded-lg border", "text-sm")}>@radix-ui/primitives</div>
      <CollapsibleContent className="space-y-2">
        <div className={cn("px-4 py-2", "rounded-lg border", "text-sm")}>@radix-ui/colors</div>
        <div className={cn("px-4 py-2", "rounded-lg border", "text-sm")}>@stitches/react</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
