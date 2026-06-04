import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { PlusIcon } from "lucide-react";

const FAQS = [
  {
    q: "Do I need to configure anything?",
    a: "No. Every component is a named sub-path import with styles included — no config required.",
  },
  {
    q: "Can I tree-shake unused components?",
    a: "Yes. Each component ships separately, so you only bundle what you import.",
  },
];

export function CollapsibleFaq() {
  return (
    <div className="w-full max-w-sm divide-y divide-ui-border rounded-xl border">
      {FAQS.map((item) => (
        <Collapsible key={item.q} className="group p-3">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-ui-fg">
            {item.q}
            <PlusIcon className="size-4 shrink-0 text-ui-muted transition-transform group-data-[state=open]:rotate-45" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 text-sm leading-relaxed text-ui-muted">
            {item.a}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
