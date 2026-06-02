import { Button } from "@codefast/ui/button";
import { Toaster, toast } from "@codefast/ui/sonner";

function save(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve("ok"), 1600);
  });
}

export function SonnerAction() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster />
      <Button
        variant="outline"
        onClick={() =>
          toast("Event deleted.", {
            action: {
              label: "Undo",
              onClick: () => toast.success("Event restored."),
            },
          })
        }
      >
        With action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(save(), {
            loading: "Saving changes…",
            success: "Changes saved.",
            error: "Could not save.",
          })
        }
      >
        Promise
      </Button>
    </div>
  );
}
