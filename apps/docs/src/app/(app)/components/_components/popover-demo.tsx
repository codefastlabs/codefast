import { type JSX, useId } from "react";

import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from "@codefast/ui";

export function PopoverDemo(): JSX.Element {
  const id = useId();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-muted-foreground text-sm">Set the dimensions for the layer.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`${id}-width`}>Width</Label>
              <Input className="col-span-2 h-8" defaultValue="100%" id={`${id}-width`} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`${id}-maxWidth`}>Max. width</Label>
              <Input className="col-span-2 h-8" defaultValue="300px" id={`${id}-maxWidth`} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`${id}-height`}>Height</Label>
              <Input className="col-span-2 h-8" defaultValue="25px" id={`${id}-height`} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`${id}-maxHeight`}>Max. height</Label>
              <Input className="col-span-2 h-8" defaultValue="none" id={`${id}-maxHeight`} />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
