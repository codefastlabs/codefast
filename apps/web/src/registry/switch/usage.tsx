import { Label } from "@codefast/ui/label";
import { Switch } from "@codefast/ui/switch";

export function SwitchUsage() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  );
}
