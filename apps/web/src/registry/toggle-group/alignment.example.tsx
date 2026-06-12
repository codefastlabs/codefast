import { ToggleGroup, ToggleGroupItem } from "@codefast/ui/toggle-group";
import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from "lucide-react";
import { useState } from "react";

export function ToggleGroupAlignment() {
  const [align, setAlign] = useState("left");

  return (
    <div className="space-y-3 text-center">
      <ToggleGroup
        type="single"
        value={align}
        onValueChange={(value) => {
          if (value) {
            setAlign(value);
          }
        }}
        variant="outline"
      >
        <ToggleGroupItem aria-label="Align left" value="left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Align center" value="center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Align right" value="right">
          <AlignRightIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Justify" value="justify">
          <AlignJustifyIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-ui-muted">
        Alignment: <span className="font-medium text-ui-fg capitalize">{align}</span>
      </p>
    </div>
  );
}
