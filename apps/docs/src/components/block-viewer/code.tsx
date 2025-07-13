import { FileIcon } from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { BlockViewerCopyCodeButton } from "@/components/block-viewer/copy-code-button";
import { BlockViewerFileTree } from "@/components/block-viewer/file-tree";
import { useBlockViewer } from "@/components/block-viewer/provider";

export function BlockViewerCode(): ReactNode {
  const { activeFile, item } = useBlockViewer("BlockViewerCode");

  const file = useMemo(() => {
    return item.files?.find(({ target }) => target === activeFile);
  }, [item.files, activeFile]);

  if (!file) {
    return null;
  }

  return (
    <div className="md:h-(--height) flex overflow-hidden rounded-xl bg-zinc-950 text-white group-data-[view=preview]/block-view-wrapper:hidden md:mr-3.5">
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
          className="scheme-dark [&_pre]:bg-transparent! relative flex-1 grow overflow-auto text-white after:absolute after:inset-y-0 after:left-0 after:w-10 after:border-r after:border-zinc-800 after:bg-zinc-950 [&_[data-line-numbers]_.line:before]:sticky [&_[data-line-numbers]_.line:before]:left-0 [&_[data-line-numbers]_.line:before]:z-10 [&_[data-line-numbers]_.line:before]:mr-2 [&_[data-line-numbers]_.line:before]:inline-block [&_[data-line-numbers]_.line:before]:w-10 [&_[data-line-numbers]_.line:before]:-translate-y-px [&_[data-line-numbers]_.line:before]:border-r [&_[data-line-numbers]_.line:before]:border-zinc-800 [&_[data-line-numbers]_.line:before]:bg-zinc-950 [&_[data-line-numbers]_.line:before]:px-2 [&_[data-line-numbers]_.line:before]:text-right [&_[data-line-numbers]_.line:before]:text-xs/6 [&_[data-line-numbers]_.line:before]:text-zinc-50/40 [&_[data-line-numbers]_.line:before]:[content:counter(line)] [&_[data-line-numbers]_.line:before]:[counter-increment:line] [&_[data-line-numbers]_.line]:pl-0 [&_code]:grid [&_code]:min-w-full [&_code]:break-words [&_code]:rounded-none [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:[box-decoration-break:clone] [&_code]:[counter-reset:line] [&_pre]:relative [&_pre]:z-10 [&_pre]:max-h-full [&_pre]:min-h-full [&_pre]:grow [&_pre]:overflow-auto [&_pre]:py-1 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: file.highlightedContent ?? "" }}
        />
      </div>
    </div>
  );
}
