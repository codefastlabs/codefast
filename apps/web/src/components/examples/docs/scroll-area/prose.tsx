import { ScrollArea } from "@codefast/ui/scroll-area";

const PARAGRAPHS = [
  "By using this service you agree to the terms set out below. Please read them carefully.",
  "We may update these terms from time to time. Continued use constitutes acceptance of any changes.",
  "Your data is processed in line with our privacy policy and never sold to third parties.",
  "The service is provided “as is” without warranties of any kind, express or implied.",
  "These terms are governed by the laws of the jurisdiction in which the service operates.",
];

export function ScrollAreaProse() {
  return (
    <ScrollArea className="h-44 w-full max-w-sm rounded-xl border border-ui-border">
      <div className="space-y-3 p-4">
        <p className="text-sm font-semibold text-ui-fg">Terms of Service</p>
        {PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="text-xs leading-relaxed text-ui-muted">
            {paragraph}
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}
