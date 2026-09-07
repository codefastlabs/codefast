import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@codefast/ui/input-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import { AudioLinesIcon, PlusIcon } from "lucide-react";

export function ButtonGroupNested() {
  return (
    <TooltipProvider>
      <ButtonGroup>
        <ButtonGroup>
          <Button variant="outline" size="icon">
            <PlusIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <InputGroup>
            <InputGroupInput placeholder="Send a message..." />
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupAddon align="inline-end">
                  <AudioLinesIcon />
                </InputGroupAddon>
              </TooltipTrigger>
              <TooltipContent>Voice Mode</TooltipContent>
            </Tooltip>
          </InputGroup>
        </ButtonGroup>
      </ButtonGroup>
    </TooltipProvider>
  );
}
