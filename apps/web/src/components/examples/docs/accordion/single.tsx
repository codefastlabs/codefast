import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@codefast/ui/accordion";

export function AccordionSingle() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-sm">
      <AccordionItem value="q1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It follows the WAI-ARIA pattern with full keyboard navigation.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="q2">
        <AccordionTrigger>Can I customise styles?</AccordionTrigger>
        <AccordionContent>
          Yes. Every part exposes a className prop and you own the source.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="q3">
        <AccordionTrigger>Does it work with SSR?</AccordionTrigger>
        <AccordionContent>
          Yes. Everything renders server-side with no hydration issues.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
