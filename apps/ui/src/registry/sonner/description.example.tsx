import { Button } from "@codefast/ui/button";
import { toast } from "@codefast/ui/sonner";

export function SonnerDescription() {
  return (
    <Button
      variant="outline"
      className="w-fit"
      onClick={() =>
        toast("Event has been created", {
          description: "Monday, January 3rd at 6:00pm",
        })
      }
    >
      Show Toast
    </Button>
  );
}
