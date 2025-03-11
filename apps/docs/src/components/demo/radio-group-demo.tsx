import type { JSX } from 'react';

import { Label, RadioGroup, RadioGroupItem } from '@codefast/ui';

import { GridWrapper } from '@/components/grid-wrapper';

const plans = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for small businesses getting started with our platform',
    price: '$10',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Advanced features for growing businesses with higher demands',
    price: '$20',
  },
] as const;

export function RadioGroupDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div>
        <RadioGroup defaultValue="comfortable">
          <div className="flex items-center gap-3">
            <RadioGroupItem id="r1" value="default" />

            <Label htmlFor="r1">Default</Label>
          </div>

          <div className="flex items-center gap-3">
            <RadioGroupItem id="r2" value="comfortable" />

            <Label htmlFor="r2">Comfortable</Label>
          </div>

          <div className="flex items-center gap-3">
            <RadioGroupItem id="r3" value="compact" />

            <Label htmlFor="r3">Compact</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <RadioGroup className="max-w-sm" defaultValue="starter">
          {plans.map((plan) => (
            <Label
              key={plan.id}
              className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-4 has-[[data-state=checked]]:border-green-600 has-[[data-state=checked]]:bg-green-50 dark:has-[[data-state=checked]]:border-green-900 dark:has-[[data-state=checked]]:bg-green-950"
            >
              <RadioGroupItem
                className="shadow-none data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 *:data-[slot=radio-group-indicator]:[&>svg]:fill-white *:data-[slot=radio-group-indicator]:[&>svg]:stroke-white"
                id={plan.name}
                value={plan.id}
              />

              <div className="grid gap-1 font-normal">
                <div className="font-medium">{plan.name}</div>

                <div className="text-muted-foreground leading-snug">{plan.description}</div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </GridWrapper>
  );
}
