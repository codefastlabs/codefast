import type { JSX } from "react";

import { ArrowUpRightIcon, FolderIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

import { GridWrapper } from "@/components/grid-wrapper";
import {
  Button,
  Card,
  CardContent,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Kbd,
} from "@codefast/ui";

export function EmptyDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:gap-6 @3xl:grid-cols-2">
      <div>
        <Empty className="min-h-[320px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderIcon />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any projects yet. Get started by creating your first project.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button>Create project</Button>
              <Button variant="outline">Import project</Button>
            </div>
            <Button asChild className="text-muted-foreground" variant="link">
              <Link href="#">
                Learn more <ArrowUpRightIcon />
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
        <Empty className="bg-muted/70 min-h-[320px] border">
          <EmptyHeader>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDescription>
              Your search didn&apos;t return any results. Try adjusting your filters or updating
              your query.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex w-full max-w-sm flex-col gap-3">
              <div className="relative flex items-center">
                <SearchIcon aria-hidden className="text-muted-foreground absolute left-3 size-4" />
                <Input className="pl-9" placeholder="Search projects..." />
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
                <span>Press</span>
                <Kbd>/</Kbd>
                <span>to focus search</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm">Try again</Button>
              <Button size="sm" variant="outline">
                Clear filters
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
      <div>
        <Empty className="min-h-[320px]">
          <EmptyHeader>
            <EmptyTitle>Nothing to see here</EmptyTitle>
            <EmptyDescription>
              No posts have been published yet. Kick things off by{" "}
              <Link href="#">creating your first post</Link>.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline">
              <PlusIcon />
              New Post
            </Button>
          </EmptyContent>
        </Empty>
        <Card className="bg-muted/60">
          <CardContent>
            <Empty className="p-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderIcon />
                </EmptyMedia>
                <EmptyTitle>404 - Not Found</EmptyTitle>
                <EmptyDescription>
                  The page you&apos;re looking for doesn&apos;t exist. Try searching for what you
                  need below.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="w-full max-w-sm">
                  <Input placeholder="Search the docs..." />
                </div>
                <EmptyDescription>
                  Need help? <Link href="#">Contact support</Link>
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    </GridWrapper>
  );
}
