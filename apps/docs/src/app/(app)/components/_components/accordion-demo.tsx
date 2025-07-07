import { Accordion, AccordionContent, AccordionIcon, AccordionItem, AccordionTrigger } from "@codefast/ui";

import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";


export function AccordionDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <Accordion className="w-full" collapsible type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Is it accessible?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Is it styled?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>
              Yes. It comes with default styles that matches the other components&apos; aesthetic.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Is it animated?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>
              Yes. It&apos;s animated by default, but you can disable it if you prefer.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger disabled>
              Is it responsive?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>
              Yes. It&apos;s responsive by default, but you can disable it if you prefer.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="">
        <Accordion className="w-full" type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Is it accessible?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Is it styled?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>
              Yes. It comes with default styles that matches the other components&apos; aesthetic.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Is it animated?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>
              Yes. It&apos;s animated by default, but you can disable it if you prefer.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger disabled>
              Is it responsive?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>
              Yes. It&apos;s responsive by default, but you can disable it if you prefer.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="">
        <Accordion className="w-full" collapsible type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              What are the key considerations when implementing a comprehensive enterprise-level authentication system?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>
              Implementing a robust enterprise authentication system requires careful consideration of multiple factors.
              This includes secure password hashing and storage, multi-factor authentication (MFA) implementation,
              session management, OAuth2 and SSO integration, regular security audits, rate limiting to prevent brute
              force attacks, and maintaining detailed audit logs. Additionally, you&apos;ll need to consider
              scalability, performance impact, and compliance with relevant data protection regulations such as GDPR or
              HIPAA.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              How does modern distributed system architecture handle eventual consistency and data synchronization
              across multiple regions?
              <AccordionIcon />
            </AccordionTrigger>
            <AccordionContent>
              Modern distributed systems employ various strategies to maintain data consistency across regions. This
              often involves using techniques like CRDT (Conflict-Free Replicated Data Types), vector clocks, and gossip
              protocols. Systems might implement event sourcing patterns, utilize message queues for asynchronous
              updates, and employ sophisticated conflict resolution strategies. Popular solutions like Amazon&apos;s
              DynamoDB and Google&apos;s Spanner demonstrate different approaches to solving these challenges, balancing
              between consistency, availability, and partition tolerance as described in the CAP theorem.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </GridWrapper>
  );
}
