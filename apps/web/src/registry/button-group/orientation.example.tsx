import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";
import { MinusIcon, PlusIcon } from "lucide-react";

export function ButtonGroupOrientation() {
  return (
    <ButtonGroup orientation="vertical" aria-label="Media controls" className="h-fit">
      <Button variant="outline" size="icon">
        <PlusIcon />
      </Button>
      <Button variant="outline" size="icon">
        <MinusIcon />
      </Button>
    </ButtonGroup>
  );
}
