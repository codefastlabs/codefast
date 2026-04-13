import { cn } from "@codefast/tailwind-variants";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export function CopySnippetButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      className={cn(
        "shrink-0 p-1.5",
        "rounded-md",
        "text-muted-foreground",
        "transition-colors",
        "hover:bg-muted hover:text-foreground",
      )}
      aria-label="Copy code to clipboard"
    >
      {copied ? (
        <CheckIcon className={cn("size-4 text-green-800", "dark:text-green-400")} />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </button>
  );
}
