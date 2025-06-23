"use client";

import type { JSX } from "react";
import { BlockViewerCode } from "@/components/block-viewer/code";
import { BlockViewerPreview } from "@/components/block-viewer/preview";
import type { BlockViewerContextValue } from "@/components/block-viewer/provider";
import { BlockViewerProvider } from "@/components/block-viewer/provider";
import { BlockViewerToolbar } from "@/components/block-viewer/toolbar";

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
