import { Button } from "@codefast/ui/button";
import { Input } from "@codefast/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@codefast/ui/popover";
import { CheckIcon, CopyIcon, Share2Icon } from "lucide-react";
import { useState } from "react";

const LINK = "https://codefast.dev/s/9f3a2c";

export function PopoverShare() {
  const [copied, setCopied] = useState(false);

  function copy(): void {
    void navigator.clipboard?.writeText(LINK);
    setCopied(true);
  }

  return (
    <Popover onOpenChange={() => setCopied(false)}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Share2Icon data-icon="inline-start" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <PopoverHeader>
          <PopoverTitle>Share link</PopoverTitle>
          <PopoverDescription>Anyone with this link can view the page.</PopoverDescription>
        </PopoverHeader>
        <div className="mt-3 flex gap-2">
          <Input readOnly value={LINK} className="h-8 text-xs" aria-label="Share link" />
          <Button
            size="icon-sm"
            variant={copied ? "secondary" : "default"}
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy link"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
