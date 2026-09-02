import { Button } from "@codefast/ui/button";
import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps } from "react";

import type { DocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import { docPath } from "#/features/package-docs/lib/doc-kinds";
import { track } from "#/features/tracking/lib/tracking";

interface CopyDocButtonProps extends Omit<ComponentProps<typeof Button>, "children" | "onClick"> {
  readonly pkg: string;
  readonly doc: DocKindSlug;
}

/** Copies the document's raw Markdown (its `.md` twin) — the same text an LLM would be handed. */
export function CopyDocButton({ pkg, doc, variant = "outline", size = "sm", ...props }: CopyDocButtonProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard({
    onCopy: () => {
      track("copy_page", { slug: `${pkg}/${doc}`, variant: "markdown" });
    },
  });

  const copy = async (): Promise<void> => {
    const response = await fetch(`${docPath(pkg, doc)}.md`);

    if (response.ok) {
      await copyToClipboard(await response.text());
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      aria-label={isCopied ? "Copied" : "Copy page as Markdown"}
      {...props}
      onClick={() => void copy()}
    >
      {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {isCopied ? "Copied" : "Copy page"}
    </Button>
  );
}
