import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, InfoIcon, XIcon } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "#/components/alert";
import { Button } from "#/components/button";

import preview from "../.storybook/preview";

/**
 * Alert is a composition with optional root props. Demoed via `render` while
 * keeping `component` bound to the Root (Pattern C, see Card).
 */
const meta = preview.meta({
  component: Alert,
  subcomponents: { AlertTitle, AlertDescription, AlertAction },
  parameters: {
    docs: {
      description: {
        component: [
          "A callout that draws attention to a short, important message.",
          "",
          "**Anatomy:** `Alert > (icon + AlertTitle + AlertDescription + AlertAction)`.",
          'Set `variant="destructive"` for error states; drop in a leading icon and the layout adjusts automatically.',
        ].join("\n"),
      },
    },
  },
  title: "Display/Alert",
});

export const Default = meta.story({
  render: () => (
    <div className="w-full max-w-sm space-y-3">
      <Alert>
        <InfoIcon />
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>You can add components using the CLI.</AlertDescription>
        <AlertAction>
          <Button aria-label="Dismiss" size="icon-xs" variant="ghost">
            <XIcon />
          </Button>
        </AlertAction>
      </Alert>
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Session expired</AlertTitle>
        <AlertDescription>Please log in again.</AlertDescription>
      </Alert>
    </div>
  ),
});

export const Basic = meta.story({
  render: () => (
    <Alert className="max-w-md">
      <CheckCircle2Icon />
      <AlertTitle>Account updated successfully</AlertTitle>
      <AlertDescription>
        Your profile information has been saved. Changes will be reflected immediately.
      </AlertDescription>
    </Alert>
  ),
});

export const Destructive = meta.story({
  render: () => (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircleIcon />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        Your payment could not be processed. Please check your payment method and try again.
      </AlertDescription>
    </Alert>
  ),
});

export const WithAction = meta.story({
  render: () => (
    <Alert className="max-w-md">
      <AlertTitle>Dark mode is now available</AlertTitle>
      <AlertDescription>Enable it under your profile settings to get started.</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="default">
          Enable
        </Button>
      </AlertAction>
    </Alert>
  ),
});
