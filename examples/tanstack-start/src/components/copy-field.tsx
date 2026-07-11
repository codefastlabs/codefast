import { Button } from "@codefast/ui/button";
import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { Input } from "@codefast/ui/input";
import { cn } from "@codefast/ui/lib/utils";
import { Check, Copy } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";
import { useState } from "react";

interface CopyFieldProps extends Omit<ComponentProps<"div">, "children"> {
  defaultValue?: string | undefined;
}

/**
 * Editable text field paired with a copy button — demonstrates `useCopyToClipboard`
 * driving transient "Copied" feedback from its `isCopied` flag.
 */
export function CopyField({ defaultValue = "", className, ...props }: CopyFieldProps): ReactElement {
  const [value, setValue] = useState(defaultValue);
  const { copyToClipboard, isCopied } = useCopyToClipboard({ timeout: 1500 });

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Input
        aria-label="Text to copy"
        className="font-mono"
        value={value}
        // CopyField owns the input: it is the source of the text the button copies.
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <Button
        className="shrink-0"
        variant={isCopied ? "secondary" : "outline"}
        // CopyField owns the click: copies the current field value to the clipboard.
        onClick={() => {
          void copyToClipboard(value);
        }}
      >
        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {isCopied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
