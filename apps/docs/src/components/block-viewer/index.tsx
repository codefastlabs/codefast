'use client';

import type { JSX } from 'react';

import type { BlockViewerContextValue } from '@/components/block-viewer/provider';

import { BlockViewerCode } from '@/components/block-viewer/code';
import { BlockViewerPreview } from '@/components/block-viewer/preview';
import { BlockViewerProvider } from '@/components/block-viewer/provider';
import { BlockViewerToolbar } from '@/components/block-viewer/toolbar';

type BlockViewerProps = Pick<BlockViewerContextValue, 'highlightedFiles' | 'item' | 'tree'>;

export function BlockViewer({ item, tree, highlightedFiles, ...props }: BlockViewerProps): JSX.Element {
  return (
    <BlockViewerProvider highlightedFiles={highlightedFiles} item={item} tree={tree} {...props}>
      <BlockViewerToolbar />
      <BlockViewerPreview />
      <BlockViewerCode />
    </BlockViewerProvider>
  );
}
