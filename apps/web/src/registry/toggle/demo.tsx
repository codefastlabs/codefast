import { Toggle } from "@codefast/ui/toggle";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

export function ToggleDemo() {
  return (
    <div className="flex gap-1">
      <Toggle aria-label="Bold" size="sm">
        <BoldIcon />
      </Toggle>
      <Toggle aria-label="Italic" size="sm" defaultPressed>
        <ItalicIcon />
      </Toggle>
      <Toggle aria-label="Underline" size="sm">
        <UnderlineIcon />
      </Toggle>
    </div>
  );
}
