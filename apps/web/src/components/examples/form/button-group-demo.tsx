import { Button } from "@codefast/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@codefast/ui/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@codefast/ui/dropdown-menu";
import { ChevronDownIcon, PlusIcon } from "lucide-react";

export function ButtonGroupDemo() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Split button: primary action + dropdown of related actions */}
      <ButtonGroup>
        <Button>
          <PlusIcon />
          New issue
        </Button>
        <ButtonGroupSeparator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="More create options" size="icon">
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>New from template</DropdownMenuItem>
            <DropdownMenuItem>Import issues</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      {/* Labeled segmented control */}
      <ButtonGroup>
        <ButtonGroupText>Sort</ButtonGroupText>
        <Button variant="outline">Newest</Button>
        <Button variant="outline">Oldest</Button>
      </ButtonGroup>
    </div>
  );
}
