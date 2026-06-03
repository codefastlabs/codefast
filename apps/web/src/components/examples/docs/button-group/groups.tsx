import { Button } from "@codefast/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@codefast/ui/button-group";
import { ChevronDownIcon } from "lucide-react";

export function ButtonGroupGroups() {
  return (
    <div className="flex flex-col items-center gap-4">
      <ButtonGroup>
        <Button variant="outline">Copy</Button>
        <Button variant="outline">Paste</Button>
        <ButtonGroupSeparator />
        <Button variant="outline">
          More
          <ChevronDownIcon />
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <ButtonGroupText>Sort</ButtonGroupText>
        <Button variant="outline">Newest</Button>
        <Button variant="outline">Oldest</Button>
      </ButtonGroup>

      <ButtonGroup orientation="vertical">
        <Button variant="outline">Top</Button>
        <Button variant="outline">Middle</Button>
        <Button variant="outline">Bottom</Button>
      </ButtonGroup>
    </div>
  );
}
