"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  RadioCards,
  RadioCardsItem,
  Textarea,
} from "@codefast/ui";
import type { JSX } from "react";
import { useId } from "react";

const plans = [
  {
    id: "starter",
    name: "Starter Plan",
    description: "Perfect for small businesses.",
    price: "$10",
  },
  {
    id: "pro",
    name: "Pro Plan",
    description: "Advanced features with more storage.",
    price: "$20",
  },
] as const;

export function PaymentPlanForm(): JSX.Element {
  const id = useId();
  return (
    <div className="flex max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upgrade your subscription</CardTitle>
          <CardDescription>
            You are currently on the free plan. Upgrade to the pro plan to get access to all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input id={`${id}-name`} placeholder="Evil Rabbit" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input id={`${id}-email`} placeholder="example@acme.com" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-card-number`}>Card Number</Label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_80px_60px]">
                <Input
                  className="col-span-2 md:col-span-1"
                  id={`${id}-card-number`}
                  placeholder="1234 1234 1234 1234"
                />
                <Input id={`${id}-card-number-expiry`} placeholder="MM/YY" />
                <Input id={`${id}-card-number-cvc`} placeholder="CVC" />
              </div>
            </div>
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium">Plan</legend>
              <p className="text-muted-foreground text-sm">Select the plan that best fits your needs.</p>
              <RadioCards className="grid gap-3 md:grid-cols-2" defaultValue="starter">
                {plans.map((plan) => (
                  <RadioCardsItem id={plan.name} key={plan.id} value={plan.id}>
                    <div className="grid gap-1 font-normal">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-muted-foreground text-xs leading-snug">{plan.description}</div>
                    </div>
                  </RadioCardsItem>
                ))}
              </RadioCards>
            </fieldset>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-notes`}>Notes</Label>
              <Textarea id={`${id}-notes`} placeholder="Enter notes" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id={`${id}-terms`} />
                <Label className="font-normal" htmlFor={`${id}-terms`}>
                  I agree to the terms and conditions
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked id={`${id}-newsletter`} />
                <Label className="font-normal" htmlFor={`${id}-newsletter`}>
                  Allow us to send you emails
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button size="sm" variant="outline">
            Cancel
          </Button>
          <Button size="sm">Upgrade Plan</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
