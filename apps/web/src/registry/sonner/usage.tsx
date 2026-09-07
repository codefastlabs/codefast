import { Button } from "@codefast/ui/button";
import { toast } from "@codefast/ui/sonner";

export function SonnerUsage() {
  return (
    <Button variant="outline" onClick={() => toast("Event has been created.")}>
      Show Toast
    </Button>
  );
}
