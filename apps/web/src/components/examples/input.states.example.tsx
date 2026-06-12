import { Input } from "@codefast/ui/input";

export function InputStates() {
  return (
    <div className="grid w-full max-w-xs gap-3">
      <Input placeholder="Default" />
      <Input placeholder="Disabled" disabled />
      <Input readOnly defaultValue="Read-only value" />
      <Input aria-invalid placeholder="Invalid — has an error" />
    </div>
  );
}
