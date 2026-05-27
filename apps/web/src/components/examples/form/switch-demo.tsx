import { useState } from "react";
import { Switch } from "@codefast/ui/switch";
import { Label } from "@codefast/ui/label";

export function SwitchDemo() {
  const [switched, setSwitched] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch id="sw1" checked={switched} onCheckedChange={setSwitched} />
        <Label htmlFor="sw1">Notifications {switched ? "on" : "off"}</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="sw2" defaultChecked />
        <Label htmlFor="sw2">Marketing emails</Label>
      </div>
    </div>
  );
}
