import { Label } from "@codefast/ui/label";
import { NativeSelect, NativeSelectOption } from "@codefast/ui/native-select";

export function NativeSelectStates() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="native-disabled">Disabled</Label>
        <NativeSelect id="native-disabled" disabled defaultValue="standard">
          <NativeSelectOption value="standard">Standard</NativeSelectOption>
          <NativeSelectOption value="express">Express</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="native-invalid">Invalid</Label>
        <NativeSelect id="native-invalid" aria-invalid defaultValue="">
          <NativeSelectOption value="" disabled>
            Choose a plan…
          </NativeSelectOption>
          <NativeSelectOption value="free">Free</NativeSelectOption>
          <NativeSelectOption value="pro">Pro</NativeSelectOption>
        </NativeSelect>
        <p className="text-xs text-rose-500">Please choose a plan to continue.</p>
      </div>
    </div>
  );
}
