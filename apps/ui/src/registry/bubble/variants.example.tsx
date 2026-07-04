import { Bubble, BubbleContent } from "@codefast/ui/bubble";

const VARIANTS = ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const;

export function BubbleVariants() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {VARIANTS.map((variant) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent>{variant}</BubbleContent>
        </Bubble>
      ))}
    </div>
  );
}
