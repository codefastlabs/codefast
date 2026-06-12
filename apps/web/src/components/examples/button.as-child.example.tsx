import { Button } from "@codefast/ui/button";
import { ArrowUpRightIcon } from "lucide-react";

export function ButtonAsChild() {
  return (
    <Button asChild variant="outline">
      <a href="https://www.npmjs.com/package/@codefast/ui" target="_blank" rel="noreferrer">
        View on npm
        <ArrowUpRightIcon data-icon="inline-end" />
      </a>
    </Button>
  );
}
