import { Badge } from "@codefast/ui/badge";

export function BadgeAsLink() {
  return (
    <Badge asChild variant="outline">
      <a href="https://www.npmjs.com/package/@codefast/ui" target="_blank" rel="noreferrer">
        v0.3 · changelog
      </a>
    </Badge>
  );
}
