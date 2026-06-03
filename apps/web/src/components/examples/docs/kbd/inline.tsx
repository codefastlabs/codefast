import { Kbd, KbdGroup } from "@codefast/ui/kbd";

export function KbdInline() {
  return (
    <p className="max-w-xs text-center text-sm leading-relaxed text-ui-muted">
      Press{" "}
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>{" "}
      to open the command palette, or <Kbd>/</Kbd> to search.
    </p>
  );
}
