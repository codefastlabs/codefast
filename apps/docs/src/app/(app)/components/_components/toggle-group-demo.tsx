import type { JSX } from "react";

import {
  BoldIcon,
  FullscreenIcon,
  ItalicIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  UnderlineIcon,
} from "lucide-react";
import Link from "next/link";

import { GridWrapper } from "@/components/grid-wrapper";
import { buttonVariants, Separator, ToggleGroup, ToggleGroupItem } from "@codefast/ui";

export function ToggleGroupDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-content-center">
      <div>
        <ToggleGroup type="multiple">
          <ToggleGroupItem aria-label="Toggle bold" value="bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Toggle italic" value="italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Toggle strikethrough" value="strikethrough">
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <ToggleGroup
          className="*:data-[slot=toggle-group-item]:w-20"
          defaultValue="all"
          type="single"
          variant="outline"
        >
          <ToggleGroupItem aria-label="Toggle all" value="all">
            All
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Toggle missed" value="missed">
            Missed
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <ToggleGroup
          className="*:data-[slot=toggle-group-item]:px-3"
          defaultValue="last-24-hours"
          size="sm"
          type="single"
          variant="outline"
        >
          <ToggleGroupItem aria-label="Toggle last 24 hours" value="last-24-hours">
            Last 24 hours
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Toggle last 7 days" value="last-7-days">
            Last 7 days
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <ToggleGroup
          className="*:data-[slot=toggle-group-item]:px-3"
          defaultValue="last-24-hours"
          size="sm"
          type="single"
        >
          <ToggleGroupItem aria-label="Toggle last 24 hours" value="last-24-hours">
            Last 24 hours
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Toggle last 7 days" value="last-7-days">
            Last 7 days
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <div className="items-center rounded-lg border p-1">
          <ToggleGroup
            className="gap-1 *:rounded-sm *:first:rounded-l-sm *:last:rounded-r-sm"
            defaultValue="100"
            type="single"
          >
            <ToggleGroupItem className="size-6 min-w-0 p-0" title="Desktop" value="100">
              <MonitorIcon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem className="size-6 min-w-0 p-0" title="Tablet" value="60">
              <TabletIcon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem className="size-6 min-w-0 p-0" title="Mobile" value="30">
              <SmartphoneIcon className="size-4" />
            </ToggleGroupItem>
            <Separator className="h-4.5" orientation="vertical" />
            <Link
              className={buttonVariants({
                className: "size-6 p-0",
                size: "icon",
                variant: "ghost",
              })}
              href="/"
              title="Open in New Tab"
            >
              <span className="sr-only">Open in New Tab</span>
              <FullscreenIcon className="size-4" />
            </Link>
          </ToggleGroup>
        </div>
      </div>
    </GridWrapper>
  );
}
