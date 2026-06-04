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

const ITEMS = [
  { name: "Mechanical keyboard", price: "$89" },
  { name: "Wireless mouse", price: "$45" },
  { name: "Desk mat", price: "$12" },
];

export function DrawerCart() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">View cart (3)</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Your cart</DrawerTitle>
          <DrawerDescription>Review your items before checking out.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-2 px-4">
          {ITEMS.map((item) => (
            <div key={item.name} className="flex justify-between text-sm">
              <span className="text-ui-fg">{item.name}</span>
              <span className="text-ui-muted tabular-nums">{item.price}</span>
            </div>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose size="sm">Checkout — $146</DrawerClose>
          <DrawerClose size="sm" variant="outline">
            Keep shopping
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
