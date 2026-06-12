import { Button } from "@codefast/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { InfoIcon } from "lucide-react";

export function PopoverSimple() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="More info">
          <InfoIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm text-ui-muted">
        Popovers are non-modal — click outside or press Escape to dismiss. Use them for contextual details or a quick
        form.
      </PopoverContent>
    </Popover>
  );
}
