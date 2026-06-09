import { ScrollArea } from "@codefast/ui/scroll-area";

const RELEASES = [
  { version: "v2.5.0", date: "Jun 2", notes: "New Resizable component and dark-mode polish." },
  { version: "v2.4.1", date: "May 24", notes: "Fixed focus ring contrast on outline buttons." },
  { version: "v2.4.0", date: "May 18", notes: "Added Input OTP and Field validation helpers." },
  { version: "v2.3.0", date: "May 9", notes: "Carousel now supports vertical orientation." },
  { version: "v2.2.0", date: "Apr 30", notes: "Introduced Sonner toasts and Progress Circle." },
  { version: "v2.1.0", date: "Apr 21", notes: "Reworked Sidebar with collapsible groups." },
];

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-56 w-64 rounded-xl border border-ui-border">
      <div className="p-4">
        <h4 className="mb-3 text-sm font-semibold text-ui-fg">Changelog</h4>
        <ol className="space-y-3">
          {RELEASES.map(({ version, date, notes }) => (
            <li key={version} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium text-ui-fg">{version}</span>
                <span className="text-xs text-ui-muted">{date}</span>
              </div>
              <p className="text-xs leading-relaxed text-ui-muted">{notes}</p>
            </li>
          ))}
        </ol>
      </div>
    </ScrollArea>
  );
}
