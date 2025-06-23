import { useCopyToClipboard } from "@codefast/hooks";
import { Button } from "@codefast/ui";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { useBlockViewer } from "@/components/block-viewer/provider";

export function BlockViewerCopyCodeButton(): ReactNode {
  const { activeFile, item } = useBlockViewer("BlockCopyCodeButton");
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  const file = useMemo(() => {
    return item.files?.find(({ target }) => target === activeFile);
  }, [activeFile, item.files]);

  const content = file?.content;

  if (!content) {
    return null;
  }

  return (
    <Button
      className="h-7 w-7 shrink-0 rounded-lg p-0 hover:bg-zinc-700 hover:text-white focus:bg-zinc-700 focus:text-white focus-visible:bg-zinc-700 focus-visible:text-white active:bg-zinc-700 active:text-white data-[active=true]:bg-zinc-700 data-[active=true]:text-white [&>svg]:size-3"
      variant="ghost"
      onClick={() => {
        void copyToClipboard(content);
      }}
    >
      {isCopied ? <CheckIcon /> : <ClipboardIcon />}
    </Button>
  );
}
