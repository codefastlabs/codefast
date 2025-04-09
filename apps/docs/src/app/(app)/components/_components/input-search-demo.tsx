import type { JSX } from "react";

import { InputSearch } from "@codefast/ui";
import { UserSearchIcon } from "lucide-react";

import { GridWrapper } from "@/components/grid-wrapper";

export function InputSearchDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <InputSearch placeholder="Search..." />
      </div>
      <div className="">
        <InputSearch aria-invalid="true" defaultValue="Invalid search" placeholder="Invalid search" />
      </div>
      <div className="">
        <InputSearch loading placeholder="Loading..." />
      </div>
      <div className="">
        <InputSearch disabled placeholder="Disabled" />
      </div>
      <div className="">
        <InputSearch readOnly defaultValue="search term" placeholder="Read only" />
      </div>
      <div className="">
        <InputSearch placeholder="Search..." prefix={<UserSearchIcon />} />
      </div>
      <div className="">
        <InputSearch placeholder="Search..." suffix={<UserSearchIcon />} />
      </div>
    </GridWrapper>
  );
}
