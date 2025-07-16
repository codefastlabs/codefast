import { useId } from "react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Label, Switch } from "@codefast/ui";

export function SwitchDemo(): JSX.Element {
  const id = useId();

  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div>
        <div className="flex items-center gap-2">
          <Switch id={`${id}-switch-demo-airplane-mode`} />
          <Label htmlFor={`${id}-switch-demo-airplane-mode`}>Airplane Mode</Label>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Switch defaultChecked className="data-[state=checked]:bg-primary" id={`${id}-switch-demo-bluetooth`} />
          <Label htmlFor={`${id}-switch-demo-bluetooth`}>Bluetooth</Label>
        </div>
      </div>
      <div>
        <Label className="has-data-[state=checked]:border-blue-600 flex items-center gap-6 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <div className="font-medium">Share across devices</div>
            <div className="text-muted-foreground text-sm font-normal">
              Focus is shared across devices, and turns off when you leave the app.
            </div>
          </div>
          <Switch className="data-[state=checked]:bg-primary" id={`${id}-switch-demo-focus-mode`} />
        </Label>
      </div>
    </GridWrapper>
  );
}
