import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";

export function ButtonGroupUsage() {
  return (
    <ButtonGroup>
      <Button variant="outline">Copy</Button>
      <Button variant="outline">Paste</Button>
      <Button variant="outline">Cut</Button>
    </ButtonGroup>
  );
}
