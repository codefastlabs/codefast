import { Button } from "@codefast/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@codefast/ui/empty";
import { ArrowUpRightIcon, FolderCodeIcon } from "lucide-react";

export function EmptyDemo() {
  return (
    <Empty className="w-full max-w-sm">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderCodeIcon />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any projects yet. Get started by creating your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>Create Project</Button>
        <Button variant="outline">Import Project</Button>
      </EmptyContent>
      <Button asChild className="text-ui-muted" size="sm" variant="link">
        <a href="/">
          Learn More <ArrowUpRightIcon />
        </a>
      </Button>
    </Empty>
  );
}
