import { createFileRoute } from "@tanstack/react-router";

import { BadgesSection } from "#/features/ui-showcase/components/badges-section";
import { ButtonVariantsSection } from "#/features/ui-showcase/components/button-variants-section";
import { CompositionSection } from "#/features/ui-showcase/components/composition-section";
import { FeedbackDisplaySection } from "#/features/ui-showcase/components/feedback-display-section";
import { FormControlsSection } from "#/features/ui-showcase/components/form-controls-section";
import { OverlaysSection } from "#/features/ui-showcase/components/overlays-section";
import { ToastSection } from "#/features/ui-showcase/components/toast-section";

export const Route = createFileRoute("/ui")({
  component: UiPage,
});

function UiPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">@codefast/ui</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Components imported from the published package via per-component subpaths such as{" "}
          <code className="font-mono">@codefast/ui/button</code>. Use the appearance toggle in the header — every
          surface here is driven by <code className="font-mono">@codefast/theme</code>.
        </p>
      </header>

      <ButtonVariantsSection />
      <BadgesSection />
      <CompositionSection />
      <OverlaysSection />
      <FormControlsSection />
      <FeedbackDisplaySection />
      <ToastSection />
    </div>
  );
}
