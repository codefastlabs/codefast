import { Toggle } from "@codefast/ui/toggle";
import { ItalicIcon } from "lucide-react";

export function ToggleUsage() {
  return (
    <Toggle aria-label="Toggle italic">
      <ItalicIcon />
    </Toggle>
  );
}
