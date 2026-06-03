import { useState } from "react";
import { Label } from "@codefast/ui/label";
import { Textarea } from "@codefast/ui/textarea";

const MAX = 180;

export function TextareaCounter() {
  const [value, setValue] = useState("");

  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea
        id="bio"
        rows={3}
        maxLength={MAX}
        placeholder="Tell us about yourself…"
        className="resize-none"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <p className="text-right text-xs text-ui-muted tabular-nums">
        {value.length} / {MAX}
      </p>
    </div>
  );
}
