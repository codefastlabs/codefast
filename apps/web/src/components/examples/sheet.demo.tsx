import { Button } from "@codefast/ui/button";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@codefast/ui/sheet";

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Update your profile details and save changes.</SheetDescription>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-name">Name</Label>
            <Input id="sheet-name" defaultValue="Vuong Phan" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-email">Email</Label>
            <Input id="sheet-email" defaultValue="mr.thevuong@gmail.com" type="email" />
          </div>
        </SheetBody>
        <SheetFooter>
          <SheetClose size="sm" variant="outline">
            Cancel
          </SheetClose>
          <SheetClose size="sm">Save changes</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
