import { Label } from "@codefast/ui/label";
import { NativeSelect, NativeSelectOption } from "@codefast/ui/native-select";

export function NativeSelectSimple() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="native-priority">Priority</Label>
      <NativeSelect id="native-priority" defaultValue="medium">
        <NativeSelectOption value="low">Low</NativeSelectOption>
        <NativeSelectOption value="medium">Medium</NativeSelectOption>
        <NativeSelectOption value="high">High</NativeSelectOption>
        <NativeSelectOption value="urgent">Urgent</NativeSelectOption>
      </NativeSelect>
    </div>
  );
}
