import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@codefast/ui/accordion";
import { CreditCardIcon, ShieldIcon, ZapIcon } from "lucide-react";

const SECTIONS = [
  {
    value: "billing",
    icon: CreditCardIcon,
    title: "Billing",
    body: "Update your card and view past invoices.",
  },
  {
    value: "security",
    icon: ShieldIcon,
    title: "Security",
    body: "Two-factor auth and active sessions.",
  },
  {
    value: "limits",
    icon: ZapIcon,
    title: "Usage limits",
    body: "Track API calls against your plan.",
  },
];

export function AccordionIcons() {
  return (
    <Accordion type="single" collapsible defaultValue="billing" className="w-full max-w-sm">
      {SECTIONS.map(({ value, icon: Icon, title, body }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Icon className="size-4 text-ui-muted" />
              {title}
            </span>
          </AccordionTrigger>
          <AccordionContent>{body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
