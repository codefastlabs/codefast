import { Label } from "@codefast/ui/label";
import { Textarea } from "@codefast/ui/textarea";

export function TextareaStates() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="textarea-disabled">Disabled</Label>
        <Textarea id="textarea-disabled" disabled defaultValue="Read-only content" rows={2} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="textarea-invalid">Invalid</Label>
        <Textarea id="textarea-invalid" aria-invalid defaultValue="Too short" rows={2} className="resize-none" />
        <p className="text-xs text-rose-500">Please enter at least 20 characters.</p>
      </div>
    </div>
  );
}
