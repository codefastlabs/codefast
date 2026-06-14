import { Button } from "@codefast/ui/button";
import { ArrowRightIcon, DownloadIcon, PlusIcon, Trash2Icon } from "lucide-react";

export function ButtonDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {/* Primary action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button>
          <PlusIcon />
          New project
        </Button>
        <Button variant="outline">
          <DownloadIcon />
          Export
        </Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">
          <Trash2Icon />
          Delete
        </Button>
      </div>

      {/* Sizes and inline link */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary">
          Small
        </Button>
        <Button variant="secondary">Default</Button>
        <Button size="lg" variant="secondary">
          Large
        </Button>
        <Button variant="link">
          Learn more
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}
