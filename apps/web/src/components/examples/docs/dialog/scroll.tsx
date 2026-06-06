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
  DialogTrigger,
} from "@codefast/ui/dialog";

export function DialogScroll() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Read terms</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of service</DialogTitle>
          <DialogDescription>Please review before continuing.</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-64 space-y-3 overflow-y-auto text-sm text-ui-muted">
          {Array.from({ length: 8 }, (_, index) => (
            <p key={index}>
              {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio
              praesent libero sed cursus ante dapibus diam.
            </p>
          ))}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="sm" variant="outline">
              Decline
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="sm">Accept</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
