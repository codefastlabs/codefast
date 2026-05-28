import { Button } from "@codefast/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@codefast/ui/drawer";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>Make changes and save when done.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="drawer-name">Name</Label>
              <Input id="drawer-name" defaultValue="Vuong Phan" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="drawer-username">Username</Label>
              <Input id="drawer-username" defaultValue="@vuongphan" />
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <div className="flex justify-end gap-2">
            <DrawerClose size="sm" variant="outline">
              Cancel
            </DrawerClose>
            <DrawerClose size="sm">Save changes</DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
