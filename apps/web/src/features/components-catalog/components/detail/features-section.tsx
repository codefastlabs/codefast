import { SparkleIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DocSection } from "#/features/components-catalog/components/detail/doc-section";

interface FeaturesSectionProps extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children"> {
  readonly items: ReadonlyArray<string>;
}

/** The "Features" section: a short bullet list of capabilities, ahead of the API reference. */
export function FeaturesSection({ items, ...props }: FeaturesSectionProps) {
  return (
    <DocSection id="features" title="Features" {...props}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ui-muted">
            <SparkleIcon className="mt-0.5 size-4 shrink-0 text-ui-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </DocSection>
  );
}
