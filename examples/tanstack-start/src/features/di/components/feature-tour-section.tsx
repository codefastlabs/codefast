import type { TourSection } from "#/features/di/server/feature-tour";

interface FeatureTourSectionProps {
  section: TourSection;
}

/** One area of the API surface: what was called on the server, and what came back. */
export function FeatureTourSection({ section }: FeatureTourSectionProps) {
  return (
    <section className="space-y-2">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{section.title}</h3>
        <p className="text-xs text-muted-foreground">{section.blurb}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
              <th className="py-2 pr-4 font-medium">API</th>
              <th className="py-2 pr-4 font-medium">What it shows</th>
              <th className="py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {section.rows.map((row) => (
              <tr key={row.api}>
                <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">{row.api}</td>
                <td className="py-2 pr-4 text-xs text-muted-foreground">{row.what}</td>
                <td className="py-2 font-mono text-xs">{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
