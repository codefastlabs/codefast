import { Button } from "@codefast/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@codefast/ui/sheet";
import { useState } from "react";

const SIDES = ["top", "right", "bottom", "left"] as const;
type Side = (typeof SIDES)[number];

export function SheetSides() {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<Side>("right");

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2">
        {SIDES.map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            className="capitalize"
            onClick={() => {
              setSide(value);
              setOpen(true);
            }}
          >
            {value}
          </Button>
        ))}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle className="capitalize">{side} sheet</SheetTitle>
            <SheetDescription>This panel is anchored to the {side} edge.</SheetDescription>
          </SheetHeader>
          <SheetBody className="text-sm text-ui-muted">
            Sheets slide in from any edge — pick the side that fits the content.
          </SheetBody>
          <SheetClose size="sm" className="m-4">
            Close
          </SheetClose>
        </SheetContent>
      </Sheet>
    </>
  );
}
