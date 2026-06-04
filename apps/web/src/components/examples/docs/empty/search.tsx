import { Button } from "@codefast/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@codefast/ui/empty";
import { SearchXIcon } from "lucide-react";

export function EmptySearch() {
  return (
    <Empty className="w-full max-w-sm border">
      <EmptyHeader>
        <EmptyMedia>
          <SearchXIcon className="size-10 text-ui-muted" />
        </EmptyMedia>
        <EmptyTitle>No results for “invoices”</EmptyTitle>
        <EmptyDescription>Try a different keyword or clear your filters.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" variant="outline">
          Clear filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}
