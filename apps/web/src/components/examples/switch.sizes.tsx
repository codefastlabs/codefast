import { Switch } from "@codefast/ui/switch";

export function SwitchSizes() {
  return (
    <div className="flex items-center gap-4">
      <Switch size="sm" defaultChecked />
      <Switch size="default" defaultChecked />
    </div>
  );
}
