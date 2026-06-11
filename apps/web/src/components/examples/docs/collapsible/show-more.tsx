import { Button } from "@codefast/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { useState } from "react";

export function CollapsibleShowMore() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-sm space-y-2">
      <p className="text-sm leading-relaxed text-ui-fg">
        codefast/ui is a composable React component library built on Radix primitives and Tailwind
        CSS v4.
      </p>
      <CollapsibleContent className="text-sm leading-relaxed text-ui-muted">
        Every component is accessible by default, ships as a named sub-path import, and is themeable
        through a small set of CSS variables — no providers or config files required.
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <Button size="xs" variant="link" className="px-0">
          {open ? "Show less" : "Show more"}
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
