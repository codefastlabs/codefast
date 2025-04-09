import type { JSX } from "react";

import { Checkbox, Input, Label, Textarea } from "@codefast/ui";

import { GridWrapper } from "@/components/grid-wrapper";

export function LabelDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="flex items-center gap-3">
        <Checkbox id="label-demo-terms" />
        <Label htmlFor="label-demo-terms">Accept terms and conditions</Label>
      </div>
      <div className="grid gap-3">
        <Label htmlFor="label-demo-username">Username</Label>
        <Input id="label-demo-username" placeholder="Username" />
      </div>
      <div data-disabled className="group grid gap-3">
        <Label htmlFor="label-demo-disabled">Disabled</Label>
        <Input disabled id="label-demo-disabled" placeholder="Disabled" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="label-demo-message">Message</Label>
        <Textarea id="label-demo-message" placeholder="Message" />
      </div>
    </GridWrapper>
  );
}
