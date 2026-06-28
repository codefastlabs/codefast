import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

const LINE_ITEMS = [
  { name: "Pro plan (annual)", price: "$144.00" },
  { name: "Extra seats × 3", price: "$36.00" },
  { name: "Tax", price: "$14.40" },
];

export function CollapsibleDemo() {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible className="group w-full max-w-xs rounded-xl border" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start">
        <span className="text-sm font-medium text-ui-fg">Order summary</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-ui-fg">
          $194.40
          <ChevronDownIcon className="size-4 text-ui-muted transition-transform group-data-[state=open]:rotate-180" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t px-4 py-3">
        {LINE_ITEMS.map(({ name, price }) => (
          <div key={name} className="flex items-center justify-between text-sm">
            <span className="text-ui-muted">{name}</span>
            <span className="text-ui-fg">{price}</span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
