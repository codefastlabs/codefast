import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@codefast/ui";

export function NativeSelectDemo(): JSX.Element {
  return (
    <GridWrapper className="*:flex *:flex-col *:gap-4">
      <div>
        <div className="text-muted-foreground text-sm font-medium">Basic Select</div>
        <div className="flex flex-col gap-3">
          <NativeSelect className="w-[200px]" defaultValue="">
            <NativeSelectOption value="">Select a fruit</NativeSelectOption>
            <NativeSelectOption value="apple">Apple</NativeSelectOption>
            <NativeSelectOption value="banana">Banana</NativeSelectOption>
            <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
            <NativeSelectOption disabled value="grapes">
              Grapes
            </NativeSelectOption>
            <NativeSelectOption value="pineapple">Pineapple</NativeSelectOption>
          </NativeSelect>
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem disabled value="grapes">
                Grapes
              </SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <div className="text-muted-foreground text-sm font-medium">With Groups</div>
        <div className="flex flex-col gap-3">
          <NativeSelect className="w-[200px]" defaultValue="">
            <NativeSelectOption value="">Select a food</NativeSelectOption>
            <NativeSelectOptGroup label="Fruits">
              <NativeSelectOption value="apple">Apple</NativeSelectOption>
              <NativeSelectOption value="banana">Banana</NativeSelectOption>
              <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
            </NativeSelectOptGroup>
            <NativeSelectOptGroup label="Vegetables">
              <NativeSelectOption value="carrot">Carrot</NativeSelectOption>
              <NativeSelectOption value="broccoli">Broccoli</NativeSelectOption>
              <NativeSelectOption value="spinach">Spinach</NativeSelectOption>
            </NativeSelectOptGroup>
          </NativeSelect>
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a food" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Vegetables</SelectLabel>
                <SelectItem value="carrot">Carrot</SelectItem>
                <SelectItem value="broccoli">Broccoli</SelectItem>
                <SelectItem value="spinach">Spinach</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <div className="text-muted-foreground text-sm font-medium">Disabled State</div>
        <div className="flex flex-col gap-3">
          <NativeSelect disabled className="w-[200px]" defaultValue="">
            <NativeSelectOption value="">Disabled</NativeSelectOption>
            <NativeSelectOption value="apple">Apple</NativeSelectOption>
            <NativeSelectOption value="banana">Banana</NativeSelectOption>
          </NativeSelect>
          <Select disabled>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Disabled" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <div className="text-muted-foreground text-sm font-medium">Error State</div>
        <div className="flex flex-col gap-3">
          <NativeSelect aria-invalid="true" className="w-[200px]" defaultValue="">
            <NativeSelectOption value="">Error state</NativeSelectOption>
            <NativeSelectOption value="apple">Apple</NativeSelectOption>
            <NativeSelectOption value="banana">Banana</NativeSelectOption>
          </NativeSelect>
          <Select>
            <SelectTrigger aria-invalid="true" className="w-[200px]">
              <SelectValue placeholder="Error state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </GridWrapper>
  );
}
