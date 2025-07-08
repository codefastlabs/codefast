"use client";

import { BlockViewerCode } from "@/components/block-viewer/code";
import { BlockViewerPreview } from "@/components/block-viewer/preview";
import { BlockViewerProvider } from "@/components/block-viewer/provider";
import { BlockViewerToolbar } from "@/components/block-viewer/toolbar";

import type { BlockViewerContextValue } from "@/components/block-viewer/provider";
import type { JSX } from "react";

type BlockViewerProps = Pick<BlockViewerContextValue, "item" | "tree">;

export function BlockViewer({ item, tree, ...props }: BlockViewerProps): JSX.Element {
  return (
    <BlockViewerProvider item={item} tree={tree} {...props}>
      <BlockViewerToolbar />
      <BlockViewerPreview />
      <BlockViewerCode />
    </BlockViewerProvider>
  );
}
