import { Badge } from "@codefast/ui/badge";

import { DemoSection } from "#/components/demo-section";

export function BadgesSection() {
  return (
    <DemoSection title="Badges">
      <div className="flex flex-wrap items-center gap-3">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>
    </DemoSection>
  );
}
