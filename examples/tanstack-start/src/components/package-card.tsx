import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";

interface PackageCardProps extends ComponentProps<typeof Card> {
  name: string;
  version: string;
  description: string;
}

export function PackageCard({
  name,
  version,
  description,
  className,
  children,
  ...props
}: PackageCardProps): ReactElement {
  return (
    <Card className={cn("flex flex-col", className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-mono text-sm">{name}</CardTitle>
          <Badge variant="secondary">{version}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">{children}</CardContent>
    </Card>
  );
}
