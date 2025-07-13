import { type JSX, useId } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Checkbox, Input, Label, Textarea } from "@codefast/ui";

export function LabelDemo(): JSX.Element {
  const id = useId();
  return (
    <GridWrapper>
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-terms`} />
        <Label htmlFor={`${id}-terms`}>Accept terms and conditions</Label>
      </div>
      <div className="grid gap-3">
        <Label htmlFor={`${id}-username`}>Username</Label>
        <Input id={`${id}-username`} placeholder="Username" />
      </div>
      <div data-disabled className="group grid gap-3">
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
        <Input disabled id={`${id}-disabled`} placeholder="Disabled" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor={`${id}-message`}>Message</Label>
        <Textarea id={`${id}-message`} placeholder="Message" />
      </div>
    </GridWrapper>
  );
}
