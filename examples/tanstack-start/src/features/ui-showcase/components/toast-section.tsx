import { Button } from "@codefast/ui/button";
import { toast } from "@codefast/ui/sonner";

import { DemoSection } from "#/components/demo-section";

export function ToastSection() {
  return (
    <DemoSection
      description="A single Toaster is mounted in the root document; this button pushes a toast onto it."
      title="Toast"
    >
      <Button
        variant="outline"
        onClick={() => {
          toast("Event created", {
            description: "Sunday, December 03 at 9:00 AM",
            action: { label: "Undo", onClick: () => undefined },
          });
        }}
      >
        Show toast
      </Button>
    </DemoSection>
  );
}
