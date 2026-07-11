import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";

interface ActivityLogCardProps {
  entries: Array<string>;
}

/** Append-only log from the singleton ActivityLog — proof that it survives across requests. */
export function ActivityLogCard({ entries }: ActivityLogCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity log</CardTitle>
        <CardDescription>Singleton service — entries persist across requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {entries.map((entry, index) => (
            <li key={index} className="text-muted-foreground">
              <span className="mr-2 text-foreground/40 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              {entry}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
