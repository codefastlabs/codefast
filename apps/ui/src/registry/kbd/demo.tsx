import { Kbd, KbdGroup } from "@codefast/ui/kbd";

const SHORTCUTS = [
  { action: "Open command palette", keys: ["⌘", "K"] },
  { action: "Save document", keys: ["⌘", "S"] },
  { action: "Toggle sidebar", keys: ["⌘", "B"] },
];

export function KbdDemo() {
  return (
    <div className="w-full max-w-xs space-y-2.5">
      {SHORTCUTS.map(({ action, keys }) => (
        <div key={action} className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ui-muted">{action}</span>
          <KbdGroup>
            {keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </KbdGroup>
        </div>
      ))}
    </div>
  );
}
