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
import { useEffect, useState } from "react";

import { buildComponentMarkdown } from "#/lib/component-markdown";
import { absoluteUrl } from "#/lib/seo";
import type { ComponentMeta } from "#/registry/components";
import { loadDoc } from "#/registry/docs";

interface CopyPageMenuProps extends Omit<ComponentProps<typeof ButtonGroup>, "children"> {
  readonly component: ComponentMeta;
}

/**
 * "Copy page" split button: the main action copies the detail page as Markdown
 * (for pasting into an LLM); the chevron opens variants — view the raw Markdown
 * or hand the page off to ChatGPT / Claude. The Markdown header is built
 * synchronously from metadata and enriched once the component's `doc` chunk
 * loads, so the button never has an empty payload.
 */
export function CopyPageMenu({ component, className, ...props }: CopyPageMenuProps) {
  const [markdown, setMarkdown] = useState(() => buildComponentMarkdown(component));
  const { copyToClipboard, isCopied } = useCopyToClipboard();

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
  const markdownPath = `/components/${component.slug}.txt`;
  const markdownUrl = absoluteUrl(markdownPath);
  const prompt = `Read ${markdownUrl} so you can help me use the ${component.name} component from @codefast/ui.`;
  const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;

  return (
    <ButtonGroup className={cn("shrink-0", className)} {...props}>
      <Button variant="outline" size="sm" onClick={() => void copyToClipboard(markdown)}>
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
          <DropdownMenuItem onClick={() => void copyToClipboard(markdown)}>
            <CopyIcon />
            Copy page as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={markdownPath} target="_blank" rel="noreferrer">
              <FileTextIcon />
              View as Markdown
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={claudeUrl} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              Open in Claude
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={chatGptUrl} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              Open in ChatGPT
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
