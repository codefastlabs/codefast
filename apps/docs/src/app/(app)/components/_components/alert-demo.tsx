import type { JSX } from "react";

import {
  AlertCircleIcon,
  BookmarkCheckIcon,
  CheckCircle2Icon,
  GiftIcon,
  PopcornIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Alert, AlertDescription, AlertTitle, Button } from "@codefast/ui";

export function AlertDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Success! Your changes have been saved</AlertTitle>
          <AlertDescription>This is an alert with icon, title and description.</AlertDescription>
        </Alert>
      </div>
      <div className="">
        <Alert>
          <BookmarkCheckIcon>Heads up!</BookmarkCheckIcon>
          <AlertDescription>
            This one has an icon and a description only. No title.
          </AlertDescription>
        </Alert>
      </div>
      <div className="">
        <Alert>
          <AlertDescription>This one has a description only. No title. No icon.</AlertDescription>
        </Alert>
      </div>
      <div className="">
        <Alert>
          <PopcornIcon />
          <AlertTitle>Let&apos;s try one with icon and title.</AlertTitle>
        </Alert>
      </div>
      <div className="">
        <Alert>
          <ShieldAlertIcon />
          <AlertTitle>
            This is a very long alert title that demonstrates how the component handles extended
            text content and potentially wraps across multiple lines
          </AlertTitle>
        </Alert>
      </div>
      <div className="">
        <Alert>
          <GiftIcon />
          <AlertDescription>
            This is a very long alert description that demonstrates how the component handles
            extended text content and potentially wraps across multiple lines
          </AlertDescription>
        </Alert>
      </div>
      <div className="">
        <Alert>
          <AlertCircleIcon />
          <AlertTitle>
            This is an extremely long alert title that spans multiple lines to demonstrate how the
            component handles very lengthy headings while maintaining readability and proper text
            wrapping behavior
          </AlertTitle>
          <AlertDescription>
            This is an equally long description that contains detailed information about the alert.
            It shows how the component can accommodate extensive content while preserving proper
            spacing, alignment, and readability across different screen sizes and viewport widths.
            This helps ensure the user experience remains consistent regardless of the content
            length.
          </AlertDescription>
        </Alert>
      </div>
      <div className="">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Something went wrong!</AlertTitle>
          <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
        </Alert>
      </div>
      <div className="">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Unable to process your payment.</AlertTitle>
          <AlertDescription>
            <p>Please verify your billing information and try again.</p>
            <ul className="list-inside list-disc text-sm">
              <li>Check your card details</li>
              <li>Ensure sufficient funds</li>
              <li>Verify billing address</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
      <div className="lg:col-span-2">
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle className="max-w-[calc(100%-4rem)] overflow-ellipsis">
            The selected emails have been marked as spam.
          </AlertTitle>
          <Button className="absolute right-3 top-2.5 h-6 shadow-none" size="sm" variant="outline">
            Undo
          </Button>
        </Alert>
      </div>
      <div className="">
        <Alert className="border-amber-50 bg-amber-50 text-amber-900 dark:border-amber-950 dark:bg-amber-950 dark:text-amber-100">
          <CheckCircle2Icon />
          <AlertTitle>Plot Twist: This Alert is Actually Amber!</AlertTitle>
          <AlertDescription>This one has custom colors for light and dark mode.</AlertDescription>
        </Alert>
      </div>
    </GridWrapper>
  );
}
