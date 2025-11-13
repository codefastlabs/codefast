import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { InputSearch } from "@codefast/ui";

export function InputSearchDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <InputSearch placeholder="Search..." />
      </div>
      <div className="">
        <InputSearch
          aria-invalid="true"
          defaultValue="Invalid search"
          placeholder="Invalid search"
        />
      </div>
      <div className="">
        <InputSearch disabled placeholder="Disabled" />
      </div>
      <div className="">
        <InputSearch readOnly defaultValue="search term" placeholder="Read only" />
      </div>
      <div className="">
        <InputSearch defaultValue="Type to search" placeholder="Search with default value..." />
      </div>
    </GridWrapper>
  );
}
