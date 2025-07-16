import { useId } from "react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Checkbox, Label } from "@codefast/ui";

export function CheckboxDemo(): JSX.Element {
  const id = useId();

  return (
    <GridWrapper>
      <div className="">
        <div className="flex items-center gap-3">
          <Checkbox id={`${id}-terms`} />
          <Label htmlFor={`${id}-terms`}>Accept terms and conditions</Label>
        </div>
      </div>
      <div className="">
        <div className="flex items-center gap-3">
          <Checkbox aria-invalid="true" id={`${id}-terms-aria-invalid`} />
          <Label htmlFor={`${id}-terms-aria-invalid`}>Accept terms and conditions</Label>
        </div>
      </div>
      <div className="">
        <div className="flex items-start gap-3">
          <Checkbox defaultChecked id={`${id}-terms-2`} />
          <div className="grid gap-2">
            <Label htmlFor={`${id}-terms-2`}>Accept terms and conditions</Label>
            <p className="text-muted-foreground text-sm">
              By clicking this checkbox, you agree to the terms and conditions.
            </p>
          </div>
        </div>
      </div>
      <div className="">
        <div className="flex items-start gap-3">
          <Checkbox disabled id={`${id}-notification`} />
          <Label htmlFor={`${id}-notification`}>Enable notifications</Label>
        </div>
      </div>
      <div className="lg:col-span-2">
        <Label className="hover:not-has-disabled:not-has-aria-[checked=true]:bg-secondary has-aria-[checked=true]:border-primary has-aria-[checked=true]:bg-primary/10 flex items-start gap-3 rounded-lg border p-3">
          <Checkbox
            className="hover:not-disabled:not-aria-checked:border-input hover:not-disabled:not-aria-checked:aria-invalid:border-destructive"
            id={`${id}-toggle-2`}
          />
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm font-medium leading-none">Enable notifications</p>
            <p className="text-muted-foreground text-sm">You can enable or disable notifications at any time.</p>
          </div>
        </Label>
      </div>
    </GridWrapper>
  );
}
