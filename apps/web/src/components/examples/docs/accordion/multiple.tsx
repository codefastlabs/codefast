import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@codefast/ui/accordion";

export function AccordionMultiple() {
  return (
    <Accordion type="multiple" defaultValue={["shipping"]} className="w-full max-w-sm">
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Free worldwide shipping on orders over $50.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>30-day returns, no questions asked.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="warranty">
        <AccordionTrigger>Warranty</AccordionTrigger>
        <AccordionContent>Every product is covered by a 2-year warranty.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
