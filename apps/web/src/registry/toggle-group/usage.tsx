import { ToggleGroup, ToggleGroupItem } from "@codefast/ui/toggle-group";
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from "lucide-react";

export function ToggleGroupUsage() {
  return (
    <ToggleGroup defaultValue="left" type="single">
      <ToggleGroupItem aria-label="Align left" value="left">
        <AlignLeftIcon />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Align center" value="center">
        <AlignCenterIcon />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Align right" value="right">
        <AlignRightIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
