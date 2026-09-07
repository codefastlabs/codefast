import { ScrollArea } from "@codefast/ui/scroll-area";

export function ScrollAreaUsage() {
  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        {Array.from({ length: 20 }, (_, index) => (
          <p key={index} className="text-sm">
            Item {index + 1}
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}
