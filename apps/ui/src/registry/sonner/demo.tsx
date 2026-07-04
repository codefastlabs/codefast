import { Button } from "@codefast/ui/button";
import { Toaster, toast } from "@codefast/ui/sonner";

export function SonnerDemo() {
  return (
    <>
      <Toaster />
      <Button
        variant="outline"
        onClick={() =>
          toast("Event has been created", {
            description: "Sunday, December 03, 2023 at 9:00 AM",
            action: {
              label: "Undo",
              onClick: () => console.log("Undo"),
            },
          })
        }
      >
        Show Toast
      </Button>
    </>
  );
}
