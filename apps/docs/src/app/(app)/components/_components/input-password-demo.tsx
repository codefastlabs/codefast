import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { InputPassword } from "@codefast/ui";

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
        <InputPassword disabled placeholder="Disabled" />
      </div>
      <div className="">
        <InputPassword readOnly defaultValue="password" placeholder="Read only" />
      </div>
      <div className="">
        <InputPassword
          defaultValue="password123"
          placeholder="Enter password with default value..."
        />
      </div>
    </GridWrapper>
  );
}
