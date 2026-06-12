import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon } from "lucide-react";

export function ButtonGroupIcons() {
  return (
    <div className="flex flex-col items-center gap-4">
      <ButtonGroup>
        <Button variant="outline" size="icon" aria-label="Bold">
          <BoldIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="Italic">
          <ItalicIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="icon" aria-label="Align left">
          <AlignLeftIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="Align center">
          <AlignCenterIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="Align right">
          <AlignRightIcon />
        </Button>
      </ButtonGroup>
    </div>
  );
}
