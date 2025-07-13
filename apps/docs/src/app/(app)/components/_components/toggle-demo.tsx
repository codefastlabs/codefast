import { BoldIcon, BookmarkIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Toggle } from "@codefast/ui";

export function ToggleDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-content-center">
      <div>
        <Toggle aria-label="Toggle italic">
          <BoldIcon />
        </Toggle>
      </div>
      <div>
        <Toggle aria-label="Toggle italic">
          <UnderlineIcon />
        </Toggle>
      </div>
      <div>
        <Toggle disabled aria-label="Toggle italic">
          Disabled
        </Toggle>
      </div>
      <div>
        <Toggle aria-label="Toggle book" className="data-[state=on]:[&_svg]:fill-accent-foreground">
          <BookmarkIcon />
        </Toggle>
      </div>
      <div>
        <Toggle aria-invalid aria-label="Toggle book" className="data-[state=on]:[&_svg]:fill-accent-foreground">
          <BookmarkIcon />
        </Toggle>
      </div>
      <div>
        <Toggle disabled aria-label="Toggle italic" variant="outline">
          Disabled
        </Toggle>
      </div>
      <div>
        <Toggle aria-label="Toggle italic" variant="outline">
          <ItalicIcon />
          Italic
        </Toggle>
      </div>
      <div>
        <Toggle aria-label="Toggle book" className="data-[state=on]:[&_svg]:fill-accent-foreground" variant="outline">
          <BookmarkIcon />
        </Toggle>
      </div>
      <div>
        <Toggle
          aria-invalid
          aria-label="Toggle book"
          className="data-[state=on]:[&_svg]:fill-accent-foreground"
          variant="outline"
        >
          <BookmarkIcon />
        </Toggle>
      </div>
      <div>
        <Toggle aria-label="Toggle italic" size="sm" variant="outline">
          Small
        </Toggle>
      </div>
      <div>
        <Toggle aria-label="Toggle italic" size="lg" variant="outline">
          Large
        </Toggle>
      </div>
    </GridWrapper>
  );
}
