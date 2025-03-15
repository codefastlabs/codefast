'use client';

import type { CSSProperties, JSX } from 'react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@codefast/ui';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';

const plans = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for small businesses.',
    price: '$10',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Advanced features with more storage.',
    price: '$20',
  },
] as const;

const themes = {
  blue: {
    light: {
      '--border-hover': 'var(--color-blue-400)',
      '--border-focus': 'var(--color-blue-500)',

      '--ring': 'color-mix(in oklab, var(--color-blue-400) 35%, transparent)',

      '--primary': 'var(--color-blue-600)',
      '--primary-foreground': 'var(--color-blue-50)',

      '--secondary': 'var(--color-blue-100)',
      '--secondary-foreground': 'var(--color-blue-900)',

      '--accent': 'var(--color-blue-100)',
      '--accent-foreground': 'var(--color-blue-900)',
    },
    dark: {
      '--border-hover': 'var(--color-blue-500)',
      '--border-focus': 'var(--color-blue-600)',

      '--ring': 'color-mix(in oklab, var(--color-blue-600) 35%, transparent)',

      '--primary': 'var(--color-blue-400)',
      '--primary-foreground': 'var(--color-blue-950)',

      '--secondary': 'var(--color-blue-950)',
      '--secondary-foreground': 'var(--color-blue-100)',

      '--accent': 'var(--color-blue-900)',
      '--accent-foreground': 'var(--color-blue-100)',
    },
  },
  cyan: {
    light: {
      '--border-hover': 'var(--color-cyan-400)',
      '--border-focus': 'var(--color-cyan-500)',

      '--ring': 'color-mix(in oklab, var(--color-cyan-400) 35%, transparent)',

      '--primary': 'var(--color-cyan-600)',
      '--primary-foreground': 'var(--color-cyan-50)',

      '--secondary': 'var(--color-cyan-100)',
      '--secondary-foreground': 'var(--color-cyan-900)',

      '--accent': 'var(--color-cyan-100)',
      '--accent-foreground': 'var(--color-cyan-900)',
    },
    dark: {
      '--border-hover': 'var(--color-cyan-500)',
      '--border-focus': 'var(--color-cyan-600)',

      '--ring': 'color-mix(in oklab, var(--color-cyan-600) 35%, transparent)',

      '--primary': 'var(--color-cyan-400)',
      '--primary-foreground': 'var(--color-cyan-950)',

      '--secondary': 'var(--color-cyan-950)',
      '--secondary-foreground': 'var(--color-cyan-100)',

      '--accent': 'var(--color-cyan-900)',
      '--accent-foreground': 'var(--color-cyan-100)',
    },
  },
  lime: {
    light: {
      '--border-hover': 'var(--color-lime-400)',
      '--border-focus': 'var(--color-lime-500)',

      '--ring': 'color-mix(in oklab, var(--color-lime-400) 35%, transparent)',

      '--primary': 'var(--color-lime-600)',
      '--primary-foreground': 'var(--color-lime-50)',

      '--secondary': 'var(--color-lime-100)',
      '--secondary-foreground': 'var(--color-lime-900)',

      '--accent': 'var(--color-lime-100)',
      '--accent-foreground': 'var(--color-lime-900)',
    },
    dark: {
      '--border-hover': 'var(--color-lime-500)',
      '--border-focus': 'var(--color-lime-600)',

      '--ring': 'color-mix(in oklab, var(--color-lime-600) 35%, transparent)',

      '--primary': 'var(--color-lime-400)',
      '--primary-foreground': 'var(--color-lime-950)',

      '--secondary': 'var(--color-lime-950)',
      '--secondary-foreground': 'var(--color-lime-100)',

      '--accent': 'var(--color-lime-900)',
      '--accent-foreground': 'var(--color-lime-100)',
    },
  },
  neutral: {
    light: {
      '--border-hover': 'var(--color-neutral-400)',
      '--border-focus': 'var(--color-neutral-500)',

      '--ring': 'color-mix(in oklab, var(--color-neutral-400) 35%, transparent)',

      '--primary': 'var(--color-neutral-600)',
      '--primary-foreground': 'var(--color-neutral-50)',

      '--secondary': 'var(--color-neutral-100)',
      '--secondary-foreground': 'var(--color-neutral-900)',

      '--accent': 'var(--color-neutral-100)',
      '--accent-foreground': 'var(--color-neutral-900)',
    },
    dark: {
      '--border-hover': 'var(--color-neutral-500)',
      '--border-focus': 'var(--color-neutral-600)',

      '--ring': 'color-mix(in oklab, var(--color-neutral-600) 35%, transparent)',

      '--primary': 'var(--color-neutral-400)',
      '--primary-foreground': 'var(--color-neutral-950)',

      '--secondary': 'var(--color-neutral-950)',
      '--secondary-foreground': 'var(--color-neutral-100)',

      '--accent': 'var(--color-neutral-900)',
      '--accent-foreground': 'var(--color-neutral-100)',
    },
  },
  rose: {
    light: {
      '--border-hover': 'var(--color-rose-400)',
      '--border-focus': 'var(--color-rose-500)',

      '--ring': 'color-mix(in oklab, var(--color-rose-400) 35%, transparent)',

      '--primary': 'var(--color-rose-600)',
      '--primary-foreground': 'var(--color-rose-50)',

      '--secondary': 'var(--color-rose-100)',
      '--secondary-foreground': 'var(--color-rose-900)',

      '--accent': 'var(--color-rose-100)',
      '--accent-foreground': 'var(--color-rose-900)',
    },
    dark: {
      '--border-hover': 'var(--color-rose-500)',
      '--border-focus': 'var(--color-rose-600)',

      '--ring': 'color-mix(in oklab, var(--color-rose-600) 35%, transparent)',

      '--primary': 'var(--color-rose-400)',
      '--primary-foreground': 'var(--color-rose-950)',

      '--secondary': 'var(--color-rose-950)',
      '--secondary-foreground': 'var(--color-rose-100)',

      '--accent': 'var(--color-rose-900)',
      '--accent-foreground': 'var(--color-rose-100)',
    },
  },
  sky: {
    light: {
      '--border-hover': 'var(--color-sky-400)',
      '--border-focus': 'var(--color-sky-500)',

      '--ring': 'color-mix(in oklab, var(--color-sky-400) 35%, transparent)',

      '--primary': 'var(--color-sky-600)',
      '--primary-foreground': 'var(--color-sky-50)',

      '--secondary': 'var(--color-sky-100)',
      '--secondary-foreground': 'var(--color-sky-900)',

      '--accent': 'var(--color-sky-100)',
      '--accent-foreground': 'var(--color-sky-900)',
    },
    dark: {
      '--border-hover': 'var(--color-sky-500)',
      '--border-focus': 'var(--color-sky-600)',

      '--ring': 'color-mix(in oklab, var(--color-sky-600) 35%, transparent)',

      '--primary': 'var(--color-sky-400)',
      '--primary-foreground': 'var(--color-sky-950)',

      '--secondary': 'var(--color-sky-950)',
      '--secondary-foreground': 'var(--color-sky-100)',

      '--accent': 'var(--color-sky-900)',
      '--accent-foreground': 'var(--color-sky-100)',
    },
  },
  stone: {
    light: {
      '--border-hover': 'var(--color-stone-400)',
      '--border-focus': 'var(--color-stone-500)',

      '--ring': 'color-mix(in oklab, var(--color-stone-400) 35%, transparent)',

      '--primary': 'var(--color-stone-600)',
      '--primary-foreground': 'var(--color-stone-50)',

      '--secondary': 'var(--color-stone-100)',
      '--secondary-foreground': 'var(--color-stone-900)',

      '--accent': 'var(--color-stone-100)',
      '--accent-foreground': 'var(--color-stone-900)',
    },
    dark: {
      '--border-hover': 'var(--color-stone-500)',
      '--border-focus': 'var(--color-stone-600)',

      '--ring': 'color-mix(in oklab, var(--color-stone-600) 35%, transparent)',

      '--primary': 'var(--color-stone-400)',
      '--primary-foreground': 'var(--color-stone-950)',

      '--secondary': 'var(--color-stone-950)',
      '--secondary-foreground': 'var(--color-stone-100)',

      '--accent': 'var(--color-stone-900)',
      '--accent-foreground': 'var(--color-stone-100)',
    },
  },
  yellow: {
    light: {
      '--border-hover': 'var(--color-yellow-400)',
      '--border-focus': 'var(--color-yellow-500)',

      '--ring': 'color-mix(in oklab, var(--color-yellow-400) 35%, transparent)',

      '--primary': 'var(--color-yellow-600)',
      '--primary-foreground': 'var(--color-yellow-50)',

      '--secondary': 'var(--color-yellow-100)',
      '--secondary-foreground': 'var(--color-yellow-900)',

      '--accent': 'var(--color-yellow-100)',
      '--accent-foreground': 'var(--color-yellow-900)',
    },
    dark: {
      '--border-hover': 'var(--color-yellow-500)',
      '--border-focus': 'var(--color-yellow-600)',

      '--ring': 'color-mix(in oklab, var(--color-yellow-600) 35%, transparent)',

      '--primary': 'var(--color-yellow-400)',
      '--primary-foreground': 'var(--color-yellow-950)',

      '--secondary': 'var(--color-yellow-950)',
      '--secondary-foreground': 'var(--color-yellow-100)',

      '--accent': 'var(--color-yellow-900)',
      '--accent-foreground': 'var(--color-yellow-100)',
    },
  },
} as const;

export function FormsDemo(): JSX.Element {
  const { theme: mode = 'light' } = useTheme();
  const [theme, setTheme] = useState<keyof typeof themes | undefined>();

  const themeStyles = useMemo(() => {
    if (!theme) {
      return;
    }

    return themes[theme][mode as keyof (typeof themes)[typeof theme]];
  }, [theme, mode]);

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Card style={themeStyles as CSSProperties}>
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
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Evil Rabbit" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="example@acme.com" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-number">Card Number</Label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_80px_60px]">
                <Input className="col-span-2 md:col-span-1" id="card-number" placeholder="1234 1234 1234 1234" />
                <Input id="card-number-expiry" placeholder="MM/YY" />
                <Input id="card-number-cvc" placeholder="CVC" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="color">Color</Label>
              <Select
                onValueChange={(value) => {
                  setTheme(value as keyof typeof themes);
                }}
              >
                <SelectTrigger className="w-full" id="color">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(themes).map((themeName) => (
                    <SelectItem key={themeName} value={themeName}>
                      <div
                        className="size-3.5 rounded-full"
                        style={{
                          backgroundColor: themes[themeName as keyof typeof themes].light['--primary'],
                        }}
                      />
                      {themeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium">Plan</legend>
              <p className="text-muted-foreground text-sm">Select the plan that best fits your needs.</p>
              <RadioCards className="grid gap-3 md:grid-cols-2" defaultValue="starter">
                {plans.map((plan) => (
                  <RadioCardsItem key={plan.id} id={plan.name} value={plan.id}>
                    <div className="grid gap-1 font-normal">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-muted-foreground text-xs leading-snug">{plan.description}</div>
                    </div>
                  </RadioCardsItem>
                ))}
              </RadioCards>
            </fieldset>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Enter notes" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="terms" />
                <Label className="font-normal" htmlFor="terms">
                  I agree to the terms and conditions
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked id="newsletter" />
                <Label className="font-normal" htmlFor="newsletter">
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
