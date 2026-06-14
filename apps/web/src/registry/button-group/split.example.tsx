import { Button } from "@codefast/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@codefast/ui/button-group";
import { PlusIcon } from "lucide-react";

export function ButtonGroupSplit() {
  return (
    <ButtonGroup>
      <Button variant="secondary">Button</Button>
      <ButtonGroupSeparator />
      <Button size="icon" variant="secondary">
        <PlusIcon />
      </Button>
    </ButtonGroup>
  );
}
