import { Checkbox } from "@codefast/ui/checkbox";
import { Label } from "@codefast/ui/label";
import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui/select";
import { Slider } from "@codefast/ui/slider";
import { Textarea } from "@codefast/ui/textarea";

import { DemoSection } from "#/components/demo-section";

export function FormControlsSection() {
  return (
    <DemoSection description="Uncontrolled form controls with sensible defaults." title="Form controls">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="framework">Framework</Label>
          <Select>
            <SelectTrigger className="w-full" id="framework">
              <SelectValue placeholder="Pick a framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tanstack-start">TanStack Start</SelectItem>
              <SelectItem value="next">Next.js</SelectItem>
              <SelectItem value="remix">Remix</SelectItem>
              <SelectItem value="astro">Astro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Notifications</Label>
          <div className="flex items-center gap-2">
            <Checkbox defaultChecked id="marketing" />
            <Label htmlFor="marketing">Marketing emails</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="security" />
            <Label htmlFor="security">Security alerts</Label>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Plan</Label>
          <RadioGroup defaultValue="pro">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="plan-free" value="free" />
              <Label htmlFor="plan-free">Free</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="plan-pro" value="pro" />
              <Label htmlFor="plan-pro">Pro</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="plan-team" value="team" />
              <Label htmlFor="plan-team">Team</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label htmlFor="volume">Volume</Label>
          <Slider defaultValue={[60]} id="volume" max={100} min={0} step={1} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" placeholder="Type your message here." />
        </div>
      </div>
    </DemoSection>
  );
}
