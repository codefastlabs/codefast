import { Card, CardContent, CardHeader, Skeleton } from "@codefast/ui";

import { GridWrapper } from "@/components/grid-wrapper";

import type { JSX } from "react";

export function SkeletonDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="grid grow gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-square w-full" />
          </CardContent>
        </Card>
      </div>
    </GridWrapper>
  );
}
