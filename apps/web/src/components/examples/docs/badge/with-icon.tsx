import { Badge } from "@codefast/ui/badge";
import { CheckIcon, GitBranchIcon } from "lucide-react";

export function BadgeWithIcon() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge variant="default">
        <CheckIcon data-icon="inline-start" />
        Verified
      </Badge>
      <Badge variant="secondary">
        <GitBranchIcon data-icon="inline-start" />
        main
      </Badge>
      <Badge variant="destructive">3</Badge>
    </div>
  );
}
