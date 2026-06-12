import { Button } from "@codefast/ui/button";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@codefast/ui/popover";

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-3">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
          </PopoverHeader>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-3">
              <Label className="text-xs">Width</Label>
              <Input defaultValue="100%" className="col-span-2 h-7 text-xs" />
            </div>
            <div className="grid grid-cols-3 items-center gap-3">
              <Label className="text-xs">Height</Label>
              <Input defaultValue="auto" className="col-span-2 h-7 text-xs" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
