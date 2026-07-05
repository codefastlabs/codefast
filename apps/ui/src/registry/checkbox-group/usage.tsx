import { CheckboxGroup, CheckboxGroupItem } from "@codefast/ui/checkbox-group";
import { Label } from "@codefast/ui/label";

export function CheckboxGroupUsage() {
  return (
    <CheckboxGroup defaultValue={["mon", "wed"]}>
      <div className="flex items-center gap-2">
        <CheckboxGroupItem id="mon" value="mon" />
        <Label htmlFor="mon">Monday</Label>
      </div>
      <div className="flex items-center gap-2">
        <CheckboxGroupItem id="wed" value="wed" />
        <Label htmlFor="wed">Wednesday</Label>
      </div>
    </CheckboxGroup>
  );
}
