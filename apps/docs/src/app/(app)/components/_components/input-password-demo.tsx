import { InputPassword } from "@codefast/ui";
import { LockIcon } from "lucide-react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

export function InputPasswordDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <InputPassword placeholder="Enter password" />
      </div>
      <div className="">
        <InputPassword aria-invalid="true" placeholder="Invalid password" />
      </div>
      <div className="">
        <InputPassword loading placeholder="Loading..." />
      </div>
      <div className="">
        <InputPassword disabled placeholder="Disabled" />
      </div>
      <div className="">
        <InputPassword readOnly defaultValue="password" placeholder="Read only" />
      </div>
      <div className="">
        <InputPassword placeholder="Enter password" prefix={<LockIcon />} />
      </div>
      <div className="">
        <InputPassword placeholder="Enter password" suffix={<LockIcon />} />
      </div>
    </GridWrapper>
  );
}
