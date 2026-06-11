import { Label } from "@codefast/ui/label";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@codefast/ui/native-select";

export function NativeSelectDemo() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="ns-country">Country</Label>
        <NativeSelect id="ns-country">
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
      </div>
    </div>
  );
}
