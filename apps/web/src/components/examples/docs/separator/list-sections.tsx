import { Separator } from "@codefast/ui/separator";

const SECTIONS = [
  { label: "Account", items: ["Profile", "Password", "Sessions"] },
  { label: "Workspace", items: ["Members", "Billing", "Integrations"] },
];

export function SeparatorListSections() {
  return (
    <div className="w-full max-w-xs rounded-xl border border-ui-border">
      {SECTIONS.map((section, index) => (
        <div key={section.label}>
          {index > 0 ? <Separator /> : null}
          <div className="p-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-ui-muted uppercase">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <p key={item} className="text-sm text-ui-fg">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
