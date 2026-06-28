import { Button } from "@codefast/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@codefast/ui/button-group";

export function ButtonGroupSeparatorDemo() {
  return (
    <ButtonGroup>
      <Button variant="secondary" size="sm">
        Copy
      </Button>
      <ButtonGroupSeparator />
      <Button variant="secondary" size="sm">
        Paste
      </Button>
    </ButtonGroup>
  );
}
