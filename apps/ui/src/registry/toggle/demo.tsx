import { Toggle } from "@codefast/ui/toggle";
import { BookmarkIcon } from "lucide-react";

export function ToggleDemo() {
  return (
    <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
      <BookmarkIcon className="group-data-[state=on]/toggle:fill-ui-fg" />
      Bookmark
    </Toggle>
  );
}
