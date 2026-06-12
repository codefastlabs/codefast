import { Switch } from "@codefast/ui/switch";

export function SwitchDisabled() {
  return (
    <div className="flex items-center gap-4">
      <Switch disabled />
      <Switch disabled defaultChecked />
    </div>
  );
}
