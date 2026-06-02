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

export function SheetProfile() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Update your details, then save.</SheetDescription>
        </SheetHeader>
        <SheetBody className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-name">Name</Label>
            <Input id="sheet-name" defaultValue="Ada Lovelace" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-email">Email</Label>
            <Input id="sheet-email" type="email" defaultValue="ada@analytical.engine" />
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
