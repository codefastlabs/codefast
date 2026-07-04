import { ScrollArea } from "@codefast/ui/scroll-area";
import { Separator } from "@codefast/ui/separator";
import { Fragment } from "react";

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`);

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-72 w-48 rounded-md border border-ui-border">
      <div className="p-4">
        <h4 className="mb-4 text-sm leading-none font-medium text-ui-fg">Tags</h4>
        {tags.map((tag) => (
          <Fragment key={tag}>
            <div className="text-sm text-ui-fg">{tag}</div>
            <Separator className="my-2" />
          </Fragment>
        ))}
      </div>
    </ScrollArea>
  );
}
