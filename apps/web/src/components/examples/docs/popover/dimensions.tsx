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
import { SlidersHorizontalIcon } from "lucide-react";

const FIELDS = [
  { id: "width", label: "Width", value: "100%" },
  { id: "max-width", label: "Max. width", value: "300px" },
  { id: "height", label: "Height", value: "25px" },
  { id: "max-height", label: "Max. height", value: "none" },
];

export function PopoverDimensions() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontalIcon data-icon="inline-start" />
          Dimensions
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the selected layer.</PopoverDescription>
        </PopoverHeader>
        <div className="mt-3 grid gap-2">
          {FIELDS.map((field) => (
            <div key={field.id} className="grid grid-cols-3 items-center gap-3">
              <Label htmlFor={field.id} className="text-xs">
                {field.label}
              </Label>
              <Input id={field.id} defaultValue={field.value} className="col-span-2 h-7 text-xs" />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
