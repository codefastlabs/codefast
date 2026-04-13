import { cn } from "@codefast/tailwind-variants";
import { Button } from "@codefast/ui/button";
import { Card, CardContent } from "@codefast/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@codefast/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@codefast/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@codefast/ui/input-group";
import { Kbd } from "@codefast/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { IconArrowUpRight, IconFolderCode } from "@tabler/icons-react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function EmptyDemo() {
  return (
    <div className="grid w-full gap-8">
      <Empty className="min-h-[80svh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconFolderCode />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any projects yet. Get started by creating your first project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/">Create project</Link>
            </Button>
            <Button variant="outline">Import project</Button>
          </div>
          <Button variant="link" asChild className="text-muted-foreground">
            <Link to="/">
              Learn more <IconArrowUpRight />
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
      <Empty className={cn("min-h-[80svh]", "bg-muted")}>
        <EmptyHeader>
          <EmptyTitle>No results found</EmptyTitle>
          <EmptyDescription>
            No results found for your search. Try adjusting your search terms.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Try again</Button>
          <Button variant="link" asChild className="text-muted-foreground">
            <Link to="/">
              Learn more <IconArrowUpRight />
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
      <Empty className={cn("min-h-[80svh]", "border")}>
        <EmptyHeader>
          <EmptyTitle>404 - Not Found</EmptyTitle>
          <EmptyDescription>
            The page you&apos;re looking for doesn&apos;t exist. Try searching for what you need
            below.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <InputGroup className="w-3/4">
            <InputGroupInput placeholder="Try searching for pages..." />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <EmptyDescription>
            Need help? <Link to="/">Contact support</Link>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
      <Empty className="min-h-[80svh]">
        <EmptyHeader>
          <EmptyTitle>Nothing to see here</EmptyTitle>
          <EmptyDescription>
            No posts have been created yet. Get started by{" "}
            <Link to="/">creating your first post</Link> to share with the community.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">
            <PlusIcon />
            New Post
          </Button>
        </EmptyContent>
      </Empty>
      <div
        className={cn("flex min-h-200 items-center justify-center p-20", "rounded-xl", "bg-muted")}
      >
        <Card className="max-w-sm">
          <CardContent>
            <Empty className="p-4">
              <EmptyHeader>
                <EmptyTitle>404 - Not Found</EmptyTitle>
                <EmptyDescription>
                  The page you&apos;re looking for doesn&apos;t exist. Try searching for what you
                  need below.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <InputGroup className="w-3/4">
                  <InputGroupInput placeholder="Try searching for pages..." />
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <Kbd>/</Kbd>
                  </InputGroupAddon>
                </InputGroup>
                <EmptyDescription>
                  Need help? <Link to="/">Contact support</Link>
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
      <div
        className={cn("flex min-h-200 items-center justify-center p-20", "rounded-xl", "bg-muted")}
      >
        <Card className="max-w-sm">
          <CardContent>
            <Empty className="p-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>
                  You haven&apos;t created any projects yet. Get started by creating your first
                  project.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button asChild>
                    <Link to="/">Create project</Link>
                  </Button>
                  <Button variant="outline">Import project</Button>
                </div>
                <Button variant="link" asChild className="text-muted-foreground">
                  <Link to="/">
                    Learn more <IconArrowUpRight />
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="sr-only">
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>Dialog Description</DialogDescription>
              </DialogHeader>
              <Empty className="p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconFolderCode />
                  </EmptyMedia>
                  <EmptyTitle>No projects yet</EmptyTitle>
                  <EmptyDescription>
                    You haven&apos;t created any projects yet. Get started by creating your first
                    project.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className="flex gap-2">
                    <Button asChild>
                      <Link to="/">Create project</Link>
                    </Button>
                    <Button variant="outline">Import project</Button>
                  </div>
                  <Button variant="link" asChild className="text-muted-foreground">
                    <Link to="/">
                      Learn more <IconArrowUpRight />
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            </DialogContent>
          </Dialog>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className={cn("p-2", "rounded-3xl")}>
              <Empty className={cn("p-6", "rounded")}>
                <EmptyHeader>
                  <EmptyTitle>Nothing to see here</EmptyTitle>
                  <EmptyDescription>
                    No posts have been created yet. <Link to="/">Create your first post</Link> to
                    share with the community.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline">
                    <PlusIcon />
                    New Post
                  </Button>
                </EmptyContent>
              </Empty>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
