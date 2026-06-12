import { Label } from "@codefast/ui/label";
import { Radio } from "@codefast/ui/radio";
import { useState } from "react";

export function RadioDisabled() {
  const [value, setValue] = useState("available");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Radio
          id="ship-available"
          name="shipping"
          value="available"
          checked={value === "available"}
          onValueChange={(next) => setValue(next)}
        />
        <Label htmlFor="ship-available">Standard — in stock</Label>
      </div>
      <div className="flex items-center gap-2 opacity-50">
        <Radio id="ship-soldout" name="shipping" value="soldout" disabled checked={false} />
        <Label htmlFor="ship-soldout">Overnight — sold out</Label>
      </div>
    </div>
  );
}
