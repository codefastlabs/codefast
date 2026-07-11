import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { useMediaQuery } from "@codefast/ui/hooks/use-media-query";
import { useState } from "react";

import { AnimatedStat } from "#/features/playground/components/animated-stat";

const COUNTER_STEPS = [0, 42, 128, 512, 1024] as const;

/** use-animated-value easing toward a picked target; motion respects prefers-reduced-motion. */
export function AnimatedCounterCard() {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [stepIndex, setStepIndex] = useState(1);
  const counter = COUNTER_STEPS[stepIndex] ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Downloads</CardTitle>
        <CardDescription>Pick a target and watch the value ease into place.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatedStat animate={!prefersReducedMotion} label="this week" suffix="k" value={counter} />
        <div className="flex flex-wrap items-center gap-2">
          {COUNTER_STEPS.map((step, index) => (
            <Button
              key={step}
              size="sm"
              variant={index === stepIndex ? "default" : "outline"}
              // the card owns the counter: selects the animation target
              onClick={() => {
                setStepIndex(index);
              }}
            >
              {step}k
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
