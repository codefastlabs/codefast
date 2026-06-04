import { Button } from "@codefast/ui/button";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";

export function KbdInButton() {
  return (
    <div className="flex w-full max-w-[16rem] flex-col gap-2">
      <Button variant="outline" className="justify-between">
        Search
        <Kbd>/</Kbd>
      </Button>
      <Button variant="outline" className="justify-between">
        Command palette
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
    </div>
  );
}
