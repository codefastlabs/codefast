import { Button } from "@codefast/ui/button";

import { DemoSection } from "#/components/demo-section";

export function ButtonVariantsSection() {
  return (
    <DemoSection
      description="The full variant set, rendered straight from the shipped buttonVariants."
      title="Button variants"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
      </div>
    </DemoSection>
  );
}
