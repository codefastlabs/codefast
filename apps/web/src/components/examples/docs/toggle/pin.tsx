import { useState } from "react";
import { Toggle } from "@codefast/ui/toggle";
import { PinIcon } from "lucide-react";

export function TogglePin() {
  const [pinned, setPinned] = useState(false);

  return (
    <div className="space-y-3 text-center">
      <Toggle variant="outline" pressed={pinned} onPressedChange={setPinned}>
        <PinIcon />
        {pinned ? "Pinned" : "Pin"}
      </Toggle>
      <p className="text-xs text-ui-muted">
        State: <span className="font-medium text-ui-fg">{pinned ? "on" : "off"}</span>
      </p>
    </div>
  );
}
