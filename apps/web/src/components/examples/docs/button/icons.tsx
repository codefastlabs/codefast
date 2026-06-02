import { Button } from "@codefast/ui/button";
import { ArrowRightIcon, DownloadIcon, TrashIcon } from "lucide-react";

export function ButtonIcons() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button>
        <DownloadIcon data-icon="inline-start" />
        Download
      </Button>
      <Button variant="secondary">
        Continue
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <Button variant="destructive">
        <TrashIcon data-icon="inline-start" />
        Delete
      </Button>
    </div>
  );
}
