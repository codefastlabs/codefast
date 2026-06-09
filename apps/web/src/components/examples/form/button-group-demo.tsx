import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export function ButtonGroupDemo() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Segmented view switcher */}
      <ButtonGroup>
        <Button variant="secondary">List</Button>
        <Button variant="outline">Board</Button>
        <Button variant="outline">Timeline</Button>
      </ButtonGroup>

      {/* Pager */}
      <ButtonGroup>
        <Button variant="outline">
          <ChevronLeftIcon />
          Previous
        </Button>
        <Button variant="outline">
          Next
          <ChevronRightIcon />
        </Button>
      </ButtonGroup>
    </div>
  );
}
