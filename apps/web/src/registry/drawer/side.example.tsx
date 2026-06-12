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

export function DrawerSide() {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Open panel →</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Set the `direction` prop to slide in from any edge.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-2 px-4 text-sm text-ui-muted">
          <p>Status</p>
          <p>Assignee</p>
          <p>Labels</p>
        </div>
        <DrawerFooter>
          <DrawerClose size="sm">Apply</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
