import { Button } from "@codefast/ui/button";
import { Label } from "@codefast/ui/label";
import { Textarea } from "@codefast/ui/textarea";

export function TextareaDemo() {
  return (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor="textarea-feedback">Your feedback</Label>
      <Textarea
        id="textarea-feedback"
        className="resize-none"
        rows={3}
        placeholder="What did you think? Share your thoughts…"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-ui-muted">Markdown supported.</p>
        <Button size="sm">Send</Button>
      </div>
    </div>
  );
}
