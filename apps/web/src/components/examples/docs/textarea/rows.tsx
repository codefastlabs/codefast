import { Label } from "@codefast/ui/label";
import { Textarea } from "@codefast/ui/textarea";

export function TextareaRows() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="textarea-short">Short (2 rows)</Label>
        <Textarea id="textarea-short" rows={2} placeholder="A brief note…" className="resize-none" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="textarea-tall">Tall (6 rows)</Label>
        <Textarea id="textarea-tall" rows={6} placeholder="Room for a longer message…" className="resize-none" />
      </div>
    </div>
  );
}
