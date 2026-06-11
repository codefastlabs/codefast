import { Label } from "@codefast/ui/label";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@codefast/ui/native-select";
import { useState } from "react";

export function NativeSelectCountry() {
  const [country, setCountry] = useState("vn");

  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="country">Country</Label>
      <NativeSelect id="country" value={country} onChange={(event) => setCountry(event.target.value)}>
        <NativeSelectOptGroup label="Asia">
          <NativeSelectOption value="vn">Vietnam</NativeSelectOption>
          <NativeSelectOption value="jp">Japan</NativeSelectOption>
          <NativeSelectOption value="kr">South Korea</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Europe">
          <NativeSelectOption value="de">Germany</NativeSelectOption>
          <NativeSelectOption value="fr">France</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
      <p className="text-xs text-ui-muted">
        Selected code: <span className="font-medium text-ui-fg">{country}</span>
      </p>
    </div>
  );
}
