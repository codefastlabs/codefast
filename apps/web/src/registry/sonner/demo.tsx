import { Button } from "@codefast/ui/button";
import { Toaster, toast } from "@codefast/ui/sonner";

export function SonnerDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster />
      <Button variant="outline" onClick={() => toast("Event has been created.")}>
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.success("Profile updated.", { description: "Your changes have been saved." })}
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error("Something went wrong.", { description: "Please try again." })}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.warning("Storage almost full.", { description: "Free up some space." })}
      >
        Warning
      </Button>
    </div>
  );
}
