import { useState } from "react";
import { Button } from "@codefast/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { ChevronsUpDownIcon } from "lucide-react";

export function CollapsibleRepos() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-xs space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-lg border px-4 py-2">
        <span className="text-sm font-medium">Starred repositories</span>
        <CollapsibleTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Toggle repositories">
            <ChevronsUpDownIcon />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-lg border px-4 py-2 text-sm">@radix-ui/primitives</div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-lg border px-4 py-2 text-sm">@radix-ui/colors</div>
        <div className="rounded-lg border px-4 py-2 text-sm">@stitches/react</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
