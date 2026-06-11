import { ToggleGroup, ToggleGroupItem } from "@codefast/ui/toggle-group";
import { useState } from "react";

const VIEWS = ["List", "Board", "Calendar"];

export function ToggleGroupViews() {
  const [view, setView] = useState("Board");

  return (
    <div className="space-y-3 text-center">
      <ToggleGroup
        type="single"
        variant="outline"
        value={view}
        onValueChange={(value) => {
          if (value) {
            setView(value);
          }
        }}
      >
        {VIEWS.map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {value}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-xs text-ui-muted">
        View: <span className="font-medium text-ui-fg">{view}</span>
      </p>
    </div>
  );
}
