import { Button } from "@codefast/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@codefast/ui/button-group";

export function ButtonGroupDemo() {
  return (
    <div className="flex flex-col items-center gap-4">
      <ButtonGroup>
        <Button variant="outline">Copy</Button>
        <ButtonGroupSeparator />
        <Button variant="outline">Paste</Button>
        <ButtonGroupSeparator />
        <Button variant="outline">Cut</Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical">
        <Button variant="outline">Top</Button>
        <ButtonGroupSeparator orientation="horizontal" />
        <Button variant="outline">Middle</Button>
        <ButtonGroupSeparator orientation="horizontal" />
        <Button variant="outline">Bottom</Button>
      </ButtonGroup>
    </div>
  );
}
