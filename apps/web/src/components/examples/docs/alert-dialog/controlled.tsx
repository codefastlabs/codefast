import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@codefast/ui/alert-dialog";
import { Button } from "@codefast/ui/button";

export function AlertDialogControlled() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(0);

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        Leave page
      </Button>
      <p className="text-xs text-ui-muted">
        Confirmed <span className="font-medium text-ui-fg tabular-nums">{confirmed}</span> times
      </p>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              The open state is driven entirely from your own React state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmed((count) => count + 1);
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
