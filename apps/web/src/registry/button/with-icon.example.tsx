import { Button } from "@codefast/ui/button";
import { GitBranchIcon } from "lucide-react";

export function ButtonWithIcon() {
  return (
    <Button variant="outline" size="sm">
      <GitBranchIcon /> New Branch
    </Button>
  );
}
