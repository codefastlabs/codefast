import { useState } from "react";
import { Button } from "@codefast/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codefast/ui/dialog";

export function DialogControlled() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open programmatically
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe</DialogTitle>
            <DialogDescription>The dialog’s open state lives in your component.</DialogDescription>
          </DialogHeader>
          <DialogBody className="text-sm text-ui-muted">
            Close it from a button, a side effect, or the ✕.
          </DialogBody>
          <DialogFooter>
            <DialogClose variant="outline" size="sm">
              Maybe later
            </DialogClose>
            <Button
              size="sm"
              onClick={() => {
                setOpen(false);
              }}
            >
              Subscribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
