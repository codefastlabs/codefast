import { Button } from "@codefast/ui/button";
import { ArrowUpIcon } from "lucide-react";

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button aria-label="Submit" size="icon" variant="outline">
        <ArrowUpIcon />
      </Button>
    </div>
  );
}
