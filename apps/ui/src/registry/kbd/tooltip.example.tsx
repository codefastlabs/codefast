import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";

export function KbdTooltip() {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-4">
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Save</Button>
            </TooltipTrigger>
            <TooltipContent>
              Save Changes <Kbd>S</Kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Print</Button>
            </TooltipTrigger>
            <TooltipContent>
              Print Document{" "}
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>P</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </div>
    </TooltipProvider>
  );
}
