import { Button } from "@codefast/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="dialog-name">Name</Label>
            <Input id="dialog-name" defaultValue="Vuong Phan" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dialog-user">Username</Label>
            <Input id="dialog-user" defaultValue="@vuongphan" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose variant="outline" size="sm">
            Cancel
          </DialogClose>
          <DialogClose size="sm">Save changes</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
