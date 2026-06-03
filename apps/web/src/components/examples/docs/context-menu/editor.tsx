import { useState } from "react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@codefast/ui/context-menu";

export function ContextMenuEditor() {
  const [grid, setGrid] = useState(true);
  const [ruler, setRuler] = useState(false);
  const [density, setDensity] = useState("comfortable");

  return (
    <div className="space-y-3 text-center">
      <ContextMenu>
        <ContextMenuTrigger className="flex h-28 w-64 items-center justify-center rounded-xl border border-dashed border-ui-border text-sm text-ui-muted select-none">
          Right-click the canvas
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuLabel>View</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={grid}
            onCheckedChange={(value) => setGrid(value === true)}
          >
            Show grid
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={ruler}
            onCheckedChange={(value) => setRuler(value === true)}
          >
            Show ruler
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>Density</ContextMenuLabel>
          <ContextMenuRadioGroup value={density} onValueChange={setDensity}>
            <ContextMenuRadioItem value="compact">Compact</ContextMenuRadioItem>
            <ContextMenuRadioItem value="comfortable">Comfortable</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p className="text-xs text-ui-muted">
        grid <span className="font-medium text-ui-fg">{grid ? "on" : "off"}</span> · ruler{" "}
        <span className="font-medium text-ui-fg">{ruler ? "on" : "off"}</span> ·{" "}
        <span className="font-medium text-ui-fg">{density}</span>
      </p>
    </div>
  );
}
