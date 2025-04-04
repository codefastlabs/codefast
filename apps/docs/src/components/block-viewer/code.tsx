import type { ReactNode } from 'react';

import { FileIcon } from 'lucide-react';
import { useMemo } from 'react';

import { BlockViewerCopyCodeButton } from '@/components/block-viewer/copy-code-button';
import { BlockViewerFileTree } from '@/components/block-viewer/file-tree';
import { useBlockViewer } from '@/components/block-viewer/provider';

export function BlockViewerCode(): ReactNode {
  const { activeFile, item } = useBlockViewer('BlockViewerCode');

  const file = useMemo(() => {
    return item.files?.find(({ target }) => target === activeFile);
  }, [item.files, activeFile]);

  if (!file) {
    return null;
  }

  return (
    <div className="md:h-(--height) flex overflow-hidden rounded-xl bg-zinc-950 text-white group-data-[view=preview]/block-view-wrapper:hidden">
      <div className="w-70">
        <BlockViewerFileTree />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-700 bg-zinc-900 px-4 text-sm font-medium">
          <FileIcon className="size-4" />
          {file.target}
          <div className="ml-auto flex items-center gap-2">
            <BlockViewerCopyCodeButton />
          </div>
        </div>
        <div
          key={file.path}
          dangerouslySetInnerHTML={{ __html: file.highlightedContent ?? '' }}
          data-rehype-pretty-code-fragment=""
        />
      </div>
    </div>
  );
}
