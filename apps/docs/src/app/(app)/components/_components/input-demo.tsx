import { Input } from "@codefast/ui";
import { MailIcon } from "lucide-react";

import { GridWrapper } from "@/components/grid-wrapper";

import type { JSX } from "react";

export function InputDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <Input placeholder="Email" type="email" />
      </div>
      <div className="">
        <Input aria-invalid="true" placeholder="Error" type="text" />
      </div>
      <div className="">
        <Input placeholder="Password" type="password" />
      </div>
      <div className="">
        <Input placeholder="Number" type="number" />
      </div>
      <div className="">
        <Input placeholder="File" type="file" />
      </div>
      <div className="">
        <Input placeholder="Tel" type="tel" />
      </div>
      <div className="">
        <Input placeholder="Text" type="text" />
      </div>
      <div className="">
        <Input placeholder="URL" type="url" />
      </div>
      <div className="">
        <Input placeholder="Search" type="search" />
      </div>
      <div className="">
        <Input placeholder="Date" type="date" />
      </div>
      <div className="">
        <Input placeholder="Datetime Local" type="datetime-local" />
      </div>
      <div className="">
        <Input placeholder="Month" type="month" />
      </div>
      <div className="">
        <Input placeholder="Time" type="time" />
      </div>
      <div className="">
        <Input placeholder="Week" type="week" />
      </div>
      <div className="">
        <Input loading placeholder="Loading..." />
      </div>
      <div className="">
        <Input disabled placeholder="Disabled" />
      </div>
      <div className="">
        <Input defaultValue="Read Only" placeholder="Read Only" readOnly />
      </div>
      <div className="">
        <Input placeholder="Email" prefix={<MailIcon />} type="email" />
      </div>
      <div className="">
        <Input placeholder="Email" suffix={<MailIcon />} type="email" />
      </div>
    </GridWrapper>
  );
}
