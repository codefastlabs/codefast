import { Label } from "@codefast/ui/label";
import { Switch } from "@codefast/ui/switch";

export function LabelSwitchRow() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="label-switch-marketing">Marketing emails</Label>
        <Switch id="label-switch-marketing" defaultChecked />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="label-switch-social">Social notifications</Label>
        <Switch id="label-switch-social" />
      </div>
    </div>
  );
}
