import type { JSX } from "react";

import { InputNumber } from "@codefast/ui";
import { DollarSignIcon } from "lucide-react";

import { GridWrapper } from "@/components/grid-wrapper";

export function InputNumberDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <InputNumber placeholder="Enter a number" />
      </div>
      <div className="">
        <InputNumber aria-invalid="true" placeholder="Invalid number" />
      </div>
      <div className="">
        <InputNumber loading placeholder="Loading..." />
      </div>
      <div className="">
        <InputNumber disabled placeholder="Disabled" />
      </div>
      <div className="">
        <InputNumber readOnly defaultValue={100} placeholder="Read only" />
      </div>
      <div className="">
        <InputNumber
          formatOptions={{
            currency: "USD",
            currencyDisplay: "code",
            minimumFractionDigits: 2,
            style: "currency",
          }}
          placeholder="Enter the amount"
          prefix={<DollarSignIcon />}
        />
      </div>
      <div className="">
        <InputNumber
          formatOptions={{
            currency: "USD",
            currencyDisplay: "code",
            minimumFractionDigits: 2,
            style: "currency",
          }}
          placeholder="Enter the amount"
          suffix={<DollarSignIcon />}
        />
      </div>
    </GridWrapper>
  );
}
