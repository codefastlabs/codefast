import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";

export function CollapsibleUsage() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
      <CollapsibleContent>Yes. Free to use for personal and commercial projects.</CollapsibleContent>
    </Collapsible>
  );
}
