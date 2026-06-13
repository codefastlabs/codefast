import { Kbd, KbdGroup } from "@codefast/ui/kbd";

export function KbdGroupExample() {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Use{" "}
        <KbdGroup>
          <Kbd>Ctrl + B</Kbd>
          <Kbd>Ctrl + K</Kbd>
        </KbdGroup>{" "}
        to open the command palette
      </p>
    </div>
  );
}
