import { Label } from "@codefast/ui/label";
import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";

export function RadioGroupUsage() {
  return (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="density-default" value="default" />
        <Label htmlFor="density-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="density-comfortable" value="comfortable" />
        <Label htmlFor="density-comfortable">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="density-compact" value="compact" />
        <Label htmlFor="density-compact">Compact</Label>
      </div>
    </RadioGroup>
  );
}
