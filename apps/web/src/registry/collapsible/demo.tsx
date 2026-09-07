import { Button } from "@codefast/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";

export function CollapsibleDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible className="flex w-full max-w-xs flex-col gap-2" open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between gap-4 px-4">
        <h4 className="text-sm font-semibold text-ui-fg">Order #4189</h4>
        <CollapsibleTrigger asChild>
          <Button className="size-8" variant="ghost" size="icon">
            <ChevronsUpDownIcon />
            <span className="sr-only">Toggle details</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
        <span className="text-ui-muted">Status</span>
        <span className="font-medium text-ui-fg">Shipped</span>
      </div>
      <CollapsibleContent className="flex flex-col gap-2">
        <div className="rounded-md border px-4 py-2 text-sm">
          <p className="font-medium text-ui-fg">Shipping address</p>
          <p className="text-ui-muted">100 Market St, San Francisco</p>
        </div>
        <div className="rounded-md border px-4 py-2 text-sm">
          <p className="font-medium text-ui-fg">Items</p>
          <p className="text-ui-muted">2x Studio Headphones</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
