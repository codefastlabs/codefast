import { cn } from "@codefast/tailwind-variants";
import { Button } from "@codefast/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@codefast/ui/dialog";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make changes here. Click save when done.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className={cn("grid gap-3", "py-2")}>
            <div className="grid gap-1.5">
              <Label htmlFor="dialog-name">Name</Label>
              <Input id="dialog-name" defaultValue="Vuong Phan" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dialog-user">Username</Label>
              <Input id="dialog-user" defaultValue="@vuongphan" />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className={cn("flex justify-end gap-2", "pt-1")}>
            <DialogClose variant="outline" size="sm">
              Cancel
            </DialogClose>
            <DialogClose size="sm">Save changes</DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
