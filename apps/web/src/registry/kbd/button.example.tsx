import { Button } from "@codefast/ui/button";
import { Kbd } from "@codefast/ui/kbd";

export function KbdButton() {
  return (
    <Button variant="outline">
      Accept{" "}
      <Kbd data-icon="inline-end" className="translate-x-0.5">
        ⏎
      </Kbd>
    </Button>
  );
}
