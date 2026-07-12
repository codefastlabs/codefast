import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon, FileTextIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";

import { buildComponentMarkdown } from "#/features/components-catalog/lib/component-markdown";
import { track } from "#/features/tracking/lib/tracking";
import { absoluteUrl } from "#/lib/seo";
import type { ComponentMeta } from "#/registry/_core/components";
import { loadDoc } from "#/registry/_core/docs";

type CopyPageVariant = "markdown" | "markdown-menu";

interface CopyPageMenuProps extends Omit<ComponentProps<typeof ButtonGroup>, "children"> {
  readonly component: ComponentMeta;
}

/**
 * "Copy page" split button: copies the detail page as Markdown for an LLM; the
 * chevron opens variants (raw Markdown, open in ChatGPT/Claude). The payload is
 * built synchronously from metadata, then enriched once the `doc` chunk loads —
 * so the button is never empty.
 */
export function CopyPageMenu({ component, className, ...props }: CopyPageMenuProps) {
  const [markdown, setMarkdown] = useState(() => buildComponentMarkdown(component));
  const pendingVariantRef = useRef<CopyPageVariant>("markdown");
  const { copyToClipboard, isCopied } = useCopyToClipboard({
    onCopy: () => {
      track("copy_page", { slug: component.slug, variant: pendingVariantRef.current });
    },
  });

  useEffect(() => {
    let active = true;

    setMarkdown(buildComponentMarkdown(component));

    void loadDoc(component.slug).then((doc) => {
      if (active) {
        setMarkdown(buildComponentMarkdown(component, doc));
      }
    });

    return () => {
      active = false;
    };
  }, [component]);

  // Relative for "View as Markdown" so it opens the page on the current origin
  // (localhost in dev); absolute (production host) for the LLM hand-off, since a
  // model can't fetch localhost.
  const markdownPath = `/components/${component.slug}.md`;
  const markdownUrl = absoluteUrl(markdownPath);
  const prompt = `Read ${markdownUrl} so you can help me use the ${component.name} component from @codefast/ui.`;
  const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;

  const copyPage = (variant: CopyPageVariant) => {
    pendingVariantRef.current = variant;
    void copyToClipboard(markdown);
  };

  return (
    <ButtonGroup className={cn("shrink-0", className)} {...props}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          copyPage("markdown");
        }}
      >
        {isCopied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
        {isCopied ? "Copied" : "Copy page"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="More copy options">
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => {
              copyPage("markdown-menu");
            }}
          >
            <CopyIcon />
            Copy page as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={markdownPath}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                track("open_external", {
                  destination: "component-markdown",
                  surface: "copy-page-menu",
                  slug: component.slug,
                });
              }}
            >
              <FileTextIcon />
              View as Markdown
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href={claudeUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                track("open_external", {
                  destination: "claude",
                  surface: "copy-page-menu",
                  slug: component.slug,
                });
              }}
            >
              <ExternalLinkIcon />
              Open in Claude
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={chatGptUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                track("open_external", {
                  destination: "chatgpt",
                  surface: "copy-page-menu",
                  slug: component.slug,
                });
              }}
            >
              <ExternalLinkIcon />
              Open in ChatGPT
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
