import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@codefast/ui/toggle-group";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

export function ToggleGroupFormatting() {
  const [marks, setMarks] = useState<Array<string>>(["bold"]);

  return (
    <div className="space-y-3 text-center">
      <ToggleGroup type="multiple" value={marks} onValueChange={setMarks}>
        <ToggleGroupItem aria-label="Bold" value="bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Italic" value="italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Underline" value="underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-ui-muted">
        Active:{" "}
        <span className="font-medium text-ui-fg">{marks.length ? marks.join(", ") : "none"}</span>
      </p>
    </div>
  );
}
