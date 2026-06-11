import { Label } from "@codefast/ui/label";
import { Switch } from "@codefast/ui/switch";
import { useState } from "react";

export function SwitchWithLabel() {
  const [on, setOn] = useState(true);

  return (
    <div className="flex items-center gap-3">
      <Switch id="switch-notify" checked={on} onCheckedChange={setOn} />
      <Label htmlFor="switch-notify">Notifications {on ? "on" : "off"}</Label>
    </div>
  );
}
