import { Button } from "@codefast/ui/button";
import { PlusIcon } from "lucide-react";

export function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  );
}
