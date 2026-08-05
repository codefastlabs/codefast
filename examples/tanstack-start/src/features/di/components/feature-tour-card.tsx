import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";

import { FeatureTourSection } from "#/features/di/components/feature-tour-section";
import type { FeatureTour } from "#/features/di/server/feature-tour";

interface FeatureTourCardProps {
  tour: FeatureTour;
}

/** The rest of the API surface — everything the task board above does not already use. */
export function FeatureTourCard({ tour }: FeatureTourCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">API tour</CardTitle>
          <Badge variant="secondary">{tour.apiCount} calls</Badge>
        </div>
        <CardDescription>
          Each row below really ran on the server for this request. The board above covers constructor injection,
          modules, scopes and introspection; this covers the rest, so between them the example touches the whole surface
          of <code className="font-mono text-xs">@codefast/di</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {tour.sections.map((section) => (
          <FeatureTourSection key={section.title} section={section} />
        ))}
      </CardContent>
    </Card>
  );
}
