import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Collapsible, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

const text = `The accessibility review found two focus states that were visually too subtle in dark mode.

I checked the dialog, menu, and drawer paths because each one renders focusable controls inside a layered surface.

The dialog and drawer are fine. The menu needs the hover and focus tokens split so keyboard focus stays visible when the pointer is not involved.

I also recommend keeping the change in the style file instead of the primitive so the other themes can choose their own focus treatment later.`;

const previewLength = 180;

export function BubbleCollapsible() {
  const [open, setOpen] = useState(false);
  const isLong = text.length > previewLength;
  const preview = `${text.slice(0, previewLength)}...`;

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Bubble variant="muted">
        <BubbleContent>How can I help you today?</BubbleContent>
      </Bubble>

      <Bubble align="end" variant="muted">
        <BubbleContent className="whitespace-pre-line">
          <Collapsible open={open} onOpenChange={setOpen}>
            <div>{open || !isLong ? text : preview}</div>
            {isLong ? (
              <CollapsibleTrigger asChild>
                <Button className="gap-1 p-0 text-ui-muted" variant="link">
                  {open ? "Show less" : "Show more"}
                  <ChevronDownIcon className="group-aria-expanded/button:rotate-180" data-icon="inline-end" />
                </Button>
              </CollapsibleTrigger>
            ) : null}
          </Collapsible>
        </BubbleContent>
      </Bubble>
    </div>
  );
}
