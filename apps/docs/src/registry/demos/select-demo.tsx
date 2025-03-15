import type { JSX } from 'react';

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@codefast/ui';
import { ChartBarIcon, ChartLineIcon, ChartPieIcon, CircleDashed } from 'lucide-react';

import { GridWrapper } from '@/components/grid-wrapper';

export function SelectDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div className="">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem disabled value="grapes">
                Grapes
              </SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Large List" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 100 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key -- keep
              <SelectItem key={i} value={`item-${i}`}>
                Item {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="">
        <Select disabled>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Disabled" />
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
      <div className="">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue
              placeholder={
                <>
                  <CircleDashed className="text-muted-foreground" />
                  With Icon
                </>
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">
              <ChartLineIcon />
              Line
            </SelectItem>
            <SelectItem value="bar">
              <ChartBarIcon />
              Bar
            </SelectItem>
            <SelectItem value="pie">
              <ChartPieIcon />
              Pie
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </GridWrapper>
  );
}
