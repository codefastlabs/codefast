import { cn, RadioCards, RadioCardsItem } from "@codefast/ui";

import type { ComponentProps, JSX } from "react";

export function RadioCardsDemo({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div className={cn("", className)} {...props}>
      <RadioCards className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <RadioCardsItem value="1">
          <div className="grid gap-1 font-normal">
            <div className="font-medium">Starter Plan</div>
            <div className="text-muted-foreground leading-snug">
              Perfect for small businesses getting started with our platform
            </div>
          </div>
        </RadioCardsItem>
        <RadioCardsItem value="2">
          <div className="grid gap-1 font-normal">
            <div className="font-medium">Professional Plan</div>
            <div className="text-muted-foreground leading-snug">
              Advanced features for growing businesses with more demanding needs
            </div>
          </div>
        </RadioCardsItem>
        <RadioCardsItem value="3">
          <div className="grid gap-1 font-normal">
            <div className="font-medium">Enterprise Plan</div>
            <div className="text-muted-foreground leading-snug">
              Comprehensive solution for large organizations with custom requirements
            </div>
          </div>
        </RadioCardsItem>
        <RadioCardsItem disabled value="4">
          <div className="grid gap-1 font-normal">
            <div className="font-medium">Team Plan</div>
            <div className="text-muted-foreground leading-snug">
              Collaborative features for teams up to 10 members with shared resources
            </div>
          </div>
        </RadioCardsItem>
        <RadioCardsItem value="5">
          <div className="grid gap-1 font-normal">
            <div className="font-medium">Growth Plan</div>
            <div className="text-muted-foreground leading-snug">
              Scalable solution for businesses in rapid expansion phases
            </div>
          </div>
        </RadioCardsItem>
        <RadioCardsItem value="6">
          <div className="grid gap-1 font-normal">
            <div className="font-medium">Premium Plan</div>
            <div className="text-muted-foreground leading-snug">
              Our most exclusive offering with priority support and advanced analytics
            </div>
          </div>
        </RadioCardsItem>
      </RadioCards>
    </div>
  );
}
