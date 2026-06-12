import { Button } from "@codefast/ui/button";
import {
  Drawer,
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
        <div className="grid gap-3 overflow-auto px-4">
          <div className="grid gap-1.5">
            <Label htmlFor="drawer-name">Name</Label>
            <Input id="drawer-name" defaultValue="Vuong Phan" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="drawer-username">Username</Label>
            <Input id="drawer-username" defaultValue="@vuongphan" />
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose size="sm" variant="outline">
            Cancel
          </DrawerClose>
          <DrawerClose size="sm">Save changes</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
