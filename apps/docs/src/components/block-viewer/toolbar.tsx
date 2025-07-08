import { useCopyToClipboard } from "@codefast/hooks";
import {
  Button,
  buttonVariants,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@codefast/ui";
import { CheckIcon, FullscreenIcon, MonitorIcon, SmartphoneIcon, TabletIcon, TerminalIcon } from "lucide-react";
import Link from "next/link";

import { useBlockViewer } from "@/components/block-viewer/provider";

import type { BlockViewMode } from "@/components/block-viewer/provider";
import type { JSX } from "react";

const hasCli = false;

export function BlockViewerToolbar(): JSX.Element {
  const { setView, view, item, resizablePanelRef } = useBlockViewer("BlockViewerToolbar");
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <div className="flex w-full items-center gap-2 md:pr-3.5">
      <Tabs
        className="hidden lg:flex"
        value={view}
        onValueChange={(value) => {
          setView(value as BlockViewMode);
        }}
      >
        <TabsList className="*:py-1">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
      </Tabs>
      <Separator className="mx-2 hidden h-4 lg:flex" orientation="vertical" />
      <Link className="text-sm font-medium underline-offset-2 hover:underline" href={`/blocks/${item.slug}`}>
        {item.description}
      </Link>
      <div className="ml-auto hidden items-center gap-2 md:flex">
        <div className="hidden items-center gap-1 rounded-xl border p-1 shadow-none lg:flex">
          <ToggleGroup
            className="gap-1"
            defaultValue="100"
            size="sm"
            type="single"
            onValueChange={(value) => {
              if (resizablePanelRef.current) {
                resizablePanelRef.current.resize(Number.parseInt(value));
              }

              if (view === "code") {
                setView("preview");
              }
            }}
          >
            <ToggleGroupItem className="size-7 rounded-md first:rounded-md last:rounded-md" title="Desktop" value="100">
              <MonitorIcon />
            </ToggleGroupItem>
            <ToggleGroupItem className="size-7 rounded-md first:rounded-md last:rounded-md" title="Tablet" value="60">
              <TabletIcon />
            </ToggleGroupItem>
            <ToggleGroupItem className="size-7 rounded-md first:rounded-md last:rounded-md" title="Mobile" value="30">
              <SmartphoneIcon />
            </ToggleGroupItem>
          </ToggleGroup>
          <Separator className="h-4" orientation="vertical" />
          <Link
            className={buttonVariants({ size: "icon", variant: "ghost", className: "size-7" })}
            href={`/view/${item.slug}`}
            target="_blank"
            title="Open in New Tab"
          >
            <span className="sr-only">Open in New Tab</span>
            <FullscreenIcon />
          </Link>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO: We need to build a CLI */}
        {hasCli && (
          <>
            <Separator className="mx-1 hidden h-4 md:flex" orientation="vertical" />
            <div className="flex items-center gap-1 rounded-xl border p-1">
              <Button
                className="h-7 gap-1"
                size="sm"
                variant="ghost"
                onClick={() => {
                  void copyToClipboard(`npx codefast@latest add ${item.slug}`);
                }}
              >
                {isCopied ? <CheckIcon /> : <TerminalIcon />}
                <span className="hidden lg:inline">npx codefast add {item.slug}</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
